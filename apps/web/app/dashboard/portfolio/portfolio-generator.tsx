"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PortfolioSession } from "../../../lib/sessions";
import { exportPortfolioMarkdown } from "./actions";

type PortfolioGeneratorProps = {
  projectId?: string;
  sessions: PortfolioSession[];
};

function buildPortfolioMarkdown(sessions: PortfolioSession[]): string {
  const contributionLines =
    sessions.length === 0
      ? ["No sessions selected."]
      : sessions.flatMap((session) => [
          `- **${session.featureName}**`,
          `  - Summary: ${session.summary || "(empty)"}`,
          `  - Changed files: ${session.changedFilesCount}`,
          `  - Portfolio: ${session.portfolioText || "(empty)"}`
        ]);

  return [
    "# LetsVibe",
    "",
    "## Project Summary",
    "A local-first developer tool that converts AI-assisted coding changes into explainable development history.",
    "",
    "## Key Contributions",
    ...contributionLines,
    "",
    "## Technical Highlights",
    "- CLI-based Git diff collection",
    "- Local JSON and Markdown log generation",
    "- Dashboard session viewer",
    "- Session detail page",
    ""
  ].join("\n");
}

export function PortfolioGenerator({
  projectId,
  sessions
}: PortfolioGeneratorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [exportMessage, setExportMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const selectedSessions = useMemo(
    () => sessions.filter((session) => selectedIds.includes(session.id)),
    [selectedIds, sessions]
  );

  function toggleSession(id: string): void {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  }

  function generatePortfolio(): void {
    setGeneratedMarkdown(buildPortfolioMarkdown(selectedSessions));
    setCopyLabel("Copy");
    setExportMessage("");
  }

  async function copyMarkdown(): Promise<void> {
    if (!generatedMarkdown) {
      return;
    }

    await navigator.clipboard.writeText(generatedMarkdown);
    setCopyLabel("Copied");
  }

  async function exportMarkdown(): Promise<void> {
    if (!generatedMarkdown) {
      return;
    }

    setIsExporting(true);
    setExportMessage("");

    try {
      const filePath = await exportPortfolioMarkdown(generatedMarkdown, projectId);
      setExportMessage(`Saved to ${filePath}`);
    } finally {
      setIsExporting(false);
    }
  }

  if (sessions.length === 0) {
    return <div className="empty-state">No sessions found</div>;
  }

  return (
    <section className="portfolio-layout" aria-label="Portfolio generator">
      <div className="portfolio-panel">
        <div className="panel-heading">
          <h2>Select Sessions</h2>
          <span className="small-text">{selectedIds.length} selected</span>
        </div>

        <div className="checkbox-list">
          {sessions.map((session) => (
            <label className="checkbox-row" key={session.id}>
              <input
                checked={selectedIds.includes(session.id)}
                onChange={() => toggleSession(session.id)}
                type="checkbox"
              />
              <span>
                <strong>{session.featureName}</strong>
                <small>
                  {session.changedFilesCount} changed files ·{" "}
                  {session.createdAt}
                </small>
              </span>
            </label>
          ))}
        </div>

        <div className="portfolio-actions">
          <button
            className="button"
            disabled={selectedIds.length === 0}
            onClick={generatePortfolio}
            type="button"
          >
            Generate Portfolio
          </button>
          <button
            className="button secondary"
            disabled={!generatedMarkdown}
            onClick={copyMarkdown}
            type="button"
          >
            {copyLabel}
          </button>
          <button
            className="button secondary"
            disabled={!generatedMarkdown || isExporting}
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

      <div className="portfolio-panel preview-panel">
        <div className="panel-heading">
          <h2>Generated Markdown Preview</h2>
        </div>

        {generatedMarkdown ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {generatedMarkdown}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="preview-placeholder">
            Select one or more sessions, then generate portfolio Markdown.
          </p>
        )}
      </div>
    </section>
  );
}
