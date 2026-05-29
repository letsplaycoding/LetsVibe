"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  exportInterviewMarkdown,
  generateInterviewSet,
  type InterviewQuestion
} from "./actions";

type InterviewGeneratorProps = {
  projectId: string;
};

export function InterviewGenerator({ projectId }: InterviewGeneratorProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [markdown, setMarkdown] = useState("");
  const [provider, setProvider] = useState<"openai" | "mock" | null>(null);
  const [copyLabelByIndex, setCopyLabelByIndex] = useState<Record<number, string>>(
    {}
  );
  const [exportMessage, setExportMessage] = useState("");
  const [isGenerating, startGenerateTransition] = useTransition();
  const [isExporting, startExportTransition] = useTransition();

  function generateSet(): void {
    setExportMessage("");
    setCopyLabelByIndex({});

    startGenerateTransition(async () => {
      const result = await generateInterviewSet(projectId);
      setQuestions(result.questions);
      setMarkdown(result.markdown);
      setProvider(result.provider);
    });
  }

  async function copyAnswer(index: number, answer: string): Promise<void> {
    await navigator.clipboard.writeText(answer);
    setCopyLabelByIndex((current) => ({
      ...current,
      [index]: "Copied"
    }));
  }

  function exportMarkdown(): void {
    if (!markdown) {
      return;
    }

    setExportMessage("");

    startExportTransition(async () => {
      const filePath = await exportInterviewMarkdown(projectId, markdown);
      setExportMessage(`Saved to ${filePath}`);
    });
  }

  return (
    <section className="interview-layout" aria-label="Interview mode">
      <div className="portfolio-panel">
        <div className="panel-heading">
          <h2>Interview Set</h2>
          {provider ? <span className="tag-pill">{provider}</span> : null}
        </div>
        <p className="preview-placeholder">
          Generate project-specific questions and grounded answers from local
          session history.
        </p>

        <div className="portfolio-actions">
          <button
            className="button"
            disabled={isGenerating}
            onClick={generateSet}
            type="button"
          >
            {isGenerating
              ? "Generating..."
              : questions.length > 0
                ? "Regenerate Questions"
                : "Generate Interview Set"}
          </button>
          <button
            className="button secondary"
            disabled={!markdown || isExporting}
            onClick={exportMarkdown}
            type="button"
          >
            {isExporting ? "Exporting..." : "Export Markdown"}
          </button>
        </div>

        {exportMessage ? (
          <p className="success-message">{exportMessage}</p>
        ) : null}
      </div>

      {questions.length > 0 ? (
        <div className="interview-list">
          {questions.map((question, index) => (
            <article className="detail-panel" key={`${question.category}-${index}`}>
              <div className="panel-heading">
                <h2>{question.category}</h2>
                <button
                  className="button secondary"
                  onClick={() => copyAnswer(index, question.answer)}
                  type="button"
                >
                  {copyLabelByIndex[index] ?? "Copy Answer"}
                </button>
              </div>
              <p>
                <strong>Q: {question.question}</strong>
              </p>
              <p>{question.answer}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          Generate an interview set to review questions and answers.
        </div>
      )}

      <div className="portfolio-panel preview-panel">
        <div className="panel-heading">
          <h2>Interview Markdown Preview</h2>
        </div>

        {markdown ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        ) : (
          <p className="preview-placeholder">
            Generated interview questions and answers will appear here as
            Markdown.
          </p>
        )}
      </div>
    </section>
  );
}
