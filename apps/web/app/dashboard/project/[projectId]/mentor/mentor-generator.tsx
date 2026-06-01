"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readStoredLanguage } from "../../../../../app/language-client";
import {
  exportMentorReportMarkdown,
  generateMentorReport
} from "./actions";

type MentorGeneratorProps = {
  projectId: string;
  sessionCount: number;
};

export function MentorGenerator({
  projectId,
  sessionCount
}: MentorGeneratorProps) {
  const [markdown, setMarkdown] = useState("");
  const [provider, setProvider] = useState<"openai" | "mock" | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [exportMessage, setExportMessage] = useState("");
  const [isGenerating, startGenerateTransition] = useTransition();
  const [isExporting, startExportTransition] = useTransition();

  function generate(): void {
    setCopyLabel("Copy");
    setExportMessage("");

    startGenerateTransition(async () => {
      const result = await generateMentorReport(projectId, readStoredLanguage());
      setMarkdown(result.markdown);
      setProvider(result.provider);
    });
  }

  async function copyMarkdown(): Promise<void> {
    if (!markdown) {
      return;
    }

    await navigator.clipboard.writeText(markdown);
    setCopyLabel("Copied");
  }

  function exportMarkdown(): void {
    if (!markdown) {
      return;
    }

    setExportMessage("");

    startExportTransition(async () => {
      const filePath = await exportMentorReportMarkdown(projectId, markdown);
      setExportMessage(`Saved to ${filePath}`);
    });
  }

  return (
    <section className="portfolio-layout" aria-label="AI mentor report">
      <div className="portfolio-panel">
        <div className="panel-heading">
          <h2>AI Mentor</h2>
          {provider ? <span className="tag-pill">{provider}</span> : null}
        </div>
        <p className="preview-placeholder">
          Analyze local project history for technical debt, risk patterns, test
          gaps, documentation gaps, next priorities, and career advice.
        </p>

        <dl className="usage-grid two-column compact-stats">
          <div>
            <dt>Source sessions</dt>
            <dd>{sessionCount}</dd>
          </div>
          <div>
            <dt>Output</dt>
            <dd>Mentor report</dd>
          </div>
        </dl>

        <div className="release-section-grid" aria-label="Mentor sections">
          <div>
            <strong>Project Diagnosis</strong>
            <span>Current direction and product focus.</span>
          </div>
          <div>
            <strong>Technical Debt</strong>
            <span>Testing, docs, risk, and structure gaps.</span>
          </div>
          <div>
            <strong>Recommended Next Steps</strong>
            <span>Practical priorities for the next iteration.</span>
          </div>
        </div>

        <div className="portfolio-actions">
          <button
            className="button"
            disabled={isGenerating}
            onClick={generate}
            type="button"
          >
            {isGenerating ? "Generating..." : "Generate Mentor Report"}
          </button>
          <button
            className="button secondary"
            disabled={!markdown}
            onClick={copyMarkdown}
            type="button"
          >
            {copyLabel}
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
        {sessionCount === 0 ? (
          <p className="empty-state compact">
            No sessions found yet. Run the CLI first, then generate mentor
            guidance from saved local history.
          </p>
        ) : null}
      </div>

      <div className="portfolio-panel preview-panel">
        <div className="panel-heading">
          <h2>Mentor Report Preview</h2>
          {isGenerating ? <span className="tag-pill">generating</span> : null}
        </div>

        {isGenerating ? (
          <p className="preview-placeholder">
            Reading local sessions and preparing mentor guidance...
          </p>
        ) : markdown ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        ) : (
          <p className="preview-placeholder">
            Generated guidance will include diagnosis, strengths, risks, next
            steps, technical debt, portfolio advice, and interview advice.
          </p>
        )}
      </div>
    </section>
  );
}
