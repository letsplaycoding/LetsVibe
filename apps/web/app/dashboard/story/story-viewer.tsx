"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { exportStoryMarkdown } from "./actions";

type StoryViewerProps = {
  initialMarkdown: string;
  projectId?: string;
  provider: "openai" | "mock";
};

export function StoryViewer({
  initialMarkdown,
  projectId,
  provider
}: StoryViewerProps) {
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [exportMessage, setExportMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  async function copyMarkdown(): Promise<void> {
    if (!initialMarkdown) {
      return;
    }

    await navigator.clipboard.writeText(initialMarkdown);
    setCopyLabel("Copied");
  }

  async function exportMarkdown(): Promise<void> {
    if (!initialMarkdown) {
      return;
    }

    setIsExporting(true);
    setExportMessage("");

    try {
      const filePath = await exportStoryMarkdown(initialMarkdown, projectId);
      setExportMessage(`Saved to ${filePath}`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className="portfolio-layout" aria-label="AI project story">
      <div className="portfolio-panel">
        <div className="panel-heading">
          <h2>Story Source</h2>
          <span className="tag-pill">{provider}</span>
        </div>
        <p className="preview-placeholder">
          Generated from local session history. OpenAI is used only when an API
          key is configured; otherwise mock mode keeps the workflow local.
        </p>

        <div className="portfolio-actions">
          <button
            className="button secondary"
            disabled={!initialMarkdown}
            onClick={copyMarkdown}
            type="button"
          >
            {copyLabel}
          </button>
          <button
            className="button secondary"
            disabled={!initialMarkdown || isExporting}
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
          <h2>Project Story Preview</h2>
        </div>

        {initialMarkdown ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {initialMarkdown}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="preview-placeholder">No project story generated.</p>
        )}
      </div>
    </section>
  );
}
