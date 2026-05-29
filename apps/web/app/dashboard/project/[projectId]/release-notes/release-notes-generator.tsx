"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readStoredLanguage } from "../../../../../app/language-client";
import {
  exportReleaseNotesMarkdown,
  generateReleaseNotes
} from "./actions";

type ReleaseNotesGeneratorProps = {
  projectId: string;
  sessionCount: number;
};

export function ReleaseNotesGenerator({
  projectId,
  sessionCount
}: ReleaseNotesGeneratorProps) {
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
      const result = await generateReleaseNotes(projectId, readStoredLanguage());
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
      const filePath = await exportReleaseNotesMarkdown(projectId, markdown);
      setExportMessage(`Saved to ${filePath}`);
    });
  }

  return (
    <section className="portfolio-layout" aria-label="Release notes generator">
      <div className="portfolio-panel">
        <div className="panel-heading">
          <h2>Release Notes</h2>
          {provider ? <span className="tag-pill">{provider}</span> : null}
        </div>
        <p className="preview-placeholder">
          Generate markdown from the latest local sessions. OpenAI is used when
          configured; mock generation keeps the workflow available without
          billing.
        </p>

        <dl className="usage-grid two-column compact-stats">
          <div>
            <dt>Source sessions</dt>
            <dd>{sessionCount}</dd>
          </div>
          <div>
            <dt>Output</dt>
            <dd>Added / Improved / Fixed</dd>
          </div>
        </dl>

        <div className="release-section-grid" aria-label="Release sections">
          <div>
            <strong>Added</strong>
            <span>New capabilities from recent sessions.</span>
          </div>
          <div>
            <strong>Improved</strong>
            <span>Polish, workflow, and quality changes.</span>
          </div>
          <div>
            <strong>Fixed</strong>
            <span>Bug fixes and reliability work.</span>
          </div>
        </div>

        <div className="portfolio-actions">
          <button
            className="button"
            disabled={isGenerating || sessionCount === 0}
            onClick={generate}
            type="button"
          >
            {isGenerating ? "Generating..." : "Generate Release Notes"}
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
            No sessions found yet. Run the CLI first, then generate release
            notes from saved local history.
          </p>
        ) : null}
      </div>

      <div className="portfolio-panel preview-panel">
        <div className="panel-heading">
          <h2>Release Notes Preview</h2>
          {isGenerating ? <span className="tag-pill">generating</span> : null}
        </div>

        {isGenerating ? (
          <p className="preview-placeholder">
            Reading local sessions and preparing release notes...
          </p>
        ) : markdown ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        ) : (
          <p className="preview-placeholder">
            Generated release notes will include Added, Improved, and Fixed.
          </p>
        )}
      </div>
    </section>
  );
}
