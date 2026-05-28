"use client";

import { useMemo, useState } from "react";

type DiffViewerProps = {
  diff: string;
};

type DiffLine = {
  className: string;
  text: string;
};

function getLineClass(line: string): string {
  if (line.startsWith("+++") || line.startsWith("---")) {
    return "diff-line diff-file";
  }

  if (line.startsWith("+")) {
    return "diff-line diff-addition";
  }

  if (line.startsWith("-")) {
    return "diff-line diff-deletion";
  }

  if (line.startsWith("@@")) {
    return "diff-line diff-hunk";
  }

  return "diff-line";
}

function parseDiff(diff: string): DiffLine[] {
  return diff.split(/\r?\n/).map((line) => ({
    className: getLineClass(line),
    text: line || " "
  }));
}

export function DiffViewer({ diff }: DiffViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const lines = useMemo(() => parseDiff(diff), [diff]);

  async function copyText(value: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }

  async function copyDiff(): Promise<void> {
    try {
      await copyText(diff);
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Copy failed");
    } finally {
      window.setTimeout(() => setCopyLabel("Copy"), 1600);
    }
  }

  return (
    <div className="diff-viewer">
      <div className="diff-toolbar">
        <button
          className="button secondary"
          onClick={() => setIsOpen((value) => !value)}
          type="button"
        >
          {isOpen ? "Hide diff" : "Show diff"}
        </button>
        <button
          className="button secondary"
          disabled={!diff}
          onClick={copyDiff}
          type="button"
        >
          {copyLabel}
        </button>
      </div>

      {isOpen ? (
        diff ? (
          <pre className="diff-code" aria-label="Git diff">
            <code>
              {lines.map((line, index) => (
                <span className={line.className} key={`${index}-${line.text}`}>
                  {line.text}
                </span>
              ))}
            </code>
          </pre>
        ) : (
          <p>No diff found.</p>
        )
      ) : null}
    </div>
  );
}
