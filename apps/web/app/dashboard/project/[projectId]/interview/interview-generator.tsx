"use client";

import { useMemo, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readStoredLanguage } from "../../../../../app/language-client";
import {
  evaluateInterviewAnswer,
  exportInterviewMarkdown,
  generateInterviewSet,
  type InterviewEvaluation,
  type InterviewQuestion
} from "./actions";

type InterviewGeneratorProps = {
  projectId: string;
};

function formatEvaluationMarkdown(
  question: InterviewQuestion,
  evaluation: InterviewEvaluation
): string {
  return [
    `### Evaluation: ${question.category}`,
    "",
    `**Score:** ${evaluation.score}/10`,
    "",
    "**Strengths**",
    ...evaluation.strengths.map((item) => `- ${item}`),
    "",
    "**Improvements**",
    ...evaluation.improvements.map((item) => `- ${item}`),
    "",
    "**Improved Answer Example**",
    "",
    evaluation.improvedAnswerExample,
    ""
  ].join("\n");
}

export function InterviewGenerator({ projectId }: InterviewGeneratorProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [markdown, setMarkdown] = useState("");
  const [provider, setProvider] = useState<"openai" | "mock" | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [evaluations, setEvaluations] = useState<
    Record<number, InterviewEvaluation>
  >({});
  const [copyLabelByIndex, setCopyLabelByIndex] = useState<Record<number, string>>(
    {}
  );
  const [exportMessage, setExportMessage] = useState("");
  const [isGenerating, startGenerateTransition] = useTransition();
  const [isExporting, startExportTransition] = useTransition();
  const [evaluatingIndex, setEvaluatingIndex] = useState<number | null>(null);

  const exportMarkdown = useMemo(() => {
    const evaluationMarkdown = Object.entries(evaluations)
      .map(([index, evaluation]) => {
        const question = questions[Number(index)];

        return question ? formatEvaluationMarkdown(question, evaluation) : "";
      })
      .filter(Boolean)
      .join("\n");

    return [markdown, evaluationMarkdown ? "## Answer Evaluations" : "", evaluationMarkdown]
      .filter(Boolean)
      .join("\n\n");
  }, [evaluations, markdown, questions]);

  function generateSet(): void {
    setExportMessage("");
    setCopyLabelByIndex({});
    setEvaluations({});
    setAnswers({});

    startGenerateTransition(async () => {
      const result = await generateInterviewSet(projectId, readStoredLanguage());
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

  function evaluateAnswer(index: number, question: InterviewQuestion): void {
    const answer = answers[index]?.trim() ?? "";

    if (!answer || evaluatingIndex !== null) {
      return;
    }

    setEvaluatingIndex(index);

    startGenerateTransition(async () => {
      const evaluation = await evaluateInterviewAnswer(
        projectId,
        question,
        answer,
        readStoredLanguage()
      );
      setEvaluations((current) => ({
        ...current,
        [index]: evaluation
      }));
      setEvaluatingIndex(null);
    });
  }

  function saveMarkdown(): void {
    if (!exportMarkdown) {
      return;
    }

    setExportMessage("");

    startExportTransition(async () => {
      const filePath = await exportInterviewMarkdown(projectId, exportMarkdown);
      setExportMessage(`Saved to ${filePath}`);
    });
  }

  return (
    <section className="interview-layout" aria-label="Interview mode">
      <div className="portfolio-panel">
        <div className="panel-heading">
          <h2>Interview Prep V2</h2>
          {provider ? <span className="tag-pill">{provider}</span> : null}
        </div>
        <p className="preview-placeholder">
          Generate project-specific questions, suggested answers, follow-ups,
          key points, mistakes to avoid, and answer evaluations from local
          session history.
        </p>

        <div className="portfolio-actions">
          <button
            className="button"
            disabled={isGenerating && evaluatingIndex === null}
            onClick={generateSet}
            type="button"
          >
            {isGenerating && evaluatingIndex === null
              ? "Generating..."
              : questions.length > 0
                ? "Regenerate Questions"
                : "Generate Interview Set"}
          </button>
          <button
            className="button secondary"
            disabled={!exportMarkdown || isExporting}
            onClick={saveMarkdown}
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
          {questions.map((question, index) => {
            const evaluation = evaluations[index];

            return (
              <article
                className="detail-panel interview-card"
                key={`${question.category}-${index}`}
              >
                <div className="panel-heading">
                  <div>
                    <span className="tag-pill">{question.category}</span>
                    <h2>{question.question}</h2>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() => copyAnswer(index, question.suggestedAnswer)}
                    type="button"
                  >
                    {copyLabelByIndex[index] ?? "Copy Answer"}
                  </button>
                </div>

                <div className="interview-card-grid">
                  <section>
                    <h3>Suggested Answer</h3>
                    <p>{question.suggestedAnswer}</p>
                  </section>
                  <section>
                    <h3>Key Points</h3>
                    <ul>
                      {question.keyPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h3>Follow-up Questions</h3>
                    <ul>
                      {question.followUpQuestions.map((followUp) => (
                        <li key={followUp}>{followUp}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h3>Common Mistakes</h3>
                    <ul>
                      {question.commonMistakes.map((mistake) => (
                        <li key={mistake}>{mistake}</li>
                      ))}
                    </ul>
                  </section>
                </div>

                <div className="answer-evaluator">
                  <label className="form-field">
                    <span>My Answer</span>
                    <textarea
                      className="text-area"
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [index]: event.target.value
                        }))
                      }
                      placeholder="Write your answer, then evaluate it"
                      rows={5}
                      value={answers[index] ?? ""}
                    />
                  </label>
                  <button
                    className="button"
                    disabled={!answers[index]?.trim() || evaluatingIndex !== null}
                    onClick={() => evaluateAnswer(index, question)}
                    type="button"
                  >
                    {evaluatingIndex === index ? "Evaluating..." : "Evaluate My Answer"}
                  </button>
                </div>

                {evaluation ? (
                  <section className="evaluation-panel">
                    <div className="panel-heading">
                      <h3>Evaluation</h3>
                      <span className="badge badge-todo">
                        {evaluation.score}/10
                      </span>
                    </div>
                    <div className="interview-card-grid">
                      <section>
                        <h3>Strengths</h3>
                        <ul>
                          {evaluation.strengths.map((strength) => (
                            <li key={strength}>{strength}</li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <h3>Improvements</h3>
                        <ul>
                          {evaluation.improvements.map((improvement) => (
                            <li key={improvement}>{improvement}</li>
                          ))}
                        </ul>
                      </section>
                    </div>
                    <h3>Improved Answer Example</h3>
                    <p>{evaluation.improvedAnswerExample}</p>
                  </section>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          Generate an interview set to review questions, suggested answers, and
          evaluation prompts.
        </div>
      )}

      <div className="portfolio-panel preview-panel">
        <div className="panel-heading">
          <h2>Interview Markdown Preview</h2>
        </div>

        {exportMarkdown ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {exportMarkdown}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="preview-placeholder">
            Generated interview questions, suggested answers, and evaluations
            will appear here as Markdown.
          </p>
        )}
      </div>
    </section>
  );
}
