"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  exportCareerMarkdown,
  generateCareerMarkdown,
  type CareerStyle
} from "./actions";

type CareerGeneratorProps = {
  projectId: string;
};

const STYLE_OPTIONS: Array<{
  label: string;
  value: CareerStyle;
}> = [
  { label: "Resume", value: "resume" },
  { label: "Portfolio", value: "portfolio" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "Interview Summary", value: "interview" }
];

export function CareerGenerator({ projectId }: CareerGeneratorProps) {
  const [style, setStyle] = useState<CareerStyle>("resume");
  const [markdown, setMarkdown] = useState("");
  const [provider, setProvider] = useState<"openai" | "mock" | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [exportMessage, setExportMessage] = useState("");
  const [isGenerating, startGenerateTransition] = useTransition();
  const [isExporting, startExportTransition] = useTransition();

  function generateContent(): void {
    setExportMessage("");
    setCopyLabel("Copy");

    startGenerateTransition(async () => {
      const result = await generateCareerMarkdown(projectId, style);
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
      const filePath = await exportCareerMarkdown(projectId, style, markdown);
      setExportMessage(`Saved to ${filePath}`);
    });
  }

  return (
    <section className="portfolio-layout" aria-label="Career mode">
      <div className="portfolio-panel">
        <div className="panel-heading">
          <h2>Output Style</h2>
          {provider ? <span className="tag-pill">{provider}</span> : null}
        </div>

        <label className="sort-field">
          <span>Style</span>
          <select
            className="select-control"
            onChange={(event) => {
              setStyle(event.target.value as CareerStyle);
              setExportMessage("");
              setCopyLabel("Copy");
            }}
            value={style}
          >
            {STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="portfolio-actions">
          <button
            className="button"
            disabled={isGenerating}
            onClick={generateContent}
            type="button"
          >
            {isGenerating ? "Generating..." : "Generate"}
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
      </div>

      <div className="portfolio-panel preview-panel">
        <div className="panel-heading">
          <h2>Career Markdown Preview</h2>
        </div>

        {markdown ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        ) : (
          <p className="preview-placeholder">
            Choose a style, then generate career-ready Markdown from this
            project's local sessions.
          </p>
        )}
      </div>
    </section>
  );
}
