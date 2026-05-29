"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { WeeklyReportGroup } from "../../../lib/sessions";
import { exportWeeklyReportMarkdown } from "./actions";

type WeeklyReportGeneratorProps = {
  groups: WeeklyReportGroup[];
  projectId?: string;
};

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function buildWeeklyReportMarkdown(group: WeeklyReportGroup): string {
  const totalChangedFiles = group.sessions.reduce(
    (total, session) => total + session.changedFilesCount,
    0
  );
  const totalTokens = group.sessions.reduce(
    (total, session) => total + session.aiUsage.totalTokens,
    0
  );
  const estimatedCost = group.sessions.reduce(
    (total, session) => total + session.aiUsage.estimatedCostUsd,
    0
  );
  const tags = uniqueValues(group.sessions.flatMap((session) => session.tags));
  const changedFiles = uniqueValues(
    group.sessions.flatMap((session) => session.changedFiles)
  );
  const todos = group.sessions.flatMap((session) => session.todos);
  const keyFeatureLines = group.sessions.map(
    (session) =>
      `- **${session.featureName}**: ${session.summary || "(empty summary)"}`
  );
  const portfolioLines = group.sessions.map(
    (session) =>
      `- ${session.portfolioText || `${session.featureName}: ${session.summary}`}`
  );
  const nextStepLines =
    todos.length > 0
      ? todos.map((todo) => `- ${todo}`)
      : ["- Review the generated sessions and choose the next implementation phase."];

  return [
    `# Weekly Development Report`,
    "",
    `## Week Range`,
    group.weekRange,
    "",
    `## Total Sessions`,
    String(group.sessions.length),
    "",
    `## Key Features`,
    ...keyFeatureLines,
    "",
    `## Tags Used`,
    tags.length > 0 ? tags.map((tag) => `- ${tag}`).join("\n") : "- No tags recorded",
    "",
    `## Changed Files Summary`,
    `Total changed files: ${totalChangedFiles}`,
    "",
    changedFiles.length > 0
      ? changedFiles.map((file) => `- ${file}`).join("\n")
      : "- No changed files recorded",
    "",
    `## AI Usage and Estimated Cost`,
    `- Total tokens: ${totalTokens}`,
    `- Estimated cost: $${estimatedCost.toFixed(6)}`,
    "",
    `## Portfolio-ready Summary`,
    ...portfolioLines,
    "",
    `## Next Steps`,
    ...nextStepLines,
    ""
  ].join("\n");
}

export function WeeklyReportGenerator({
  groups,
  projectId
}: WeeklyReportGeneratorProps) {
  const [selectedWeekId, setSelectedWeekId] = useState(groups[0]?.weekId ?? "");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [exportMessage, setExportMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.weekId === selectedWeekId) ?? null,
    [groups, selectedWeekId]
  );
  const generatedMarkdown = selectedGroup
    ? buildWeeklyReportMarkdown(selectedGroup)
    : "";

  async function copyMarkdown(): Promise<void> {
    if (!generatedMarkdown) {
      return;
    }

    await navigator.clipboard.writeText(generatedMarkdown);
    setCopyLabel("Copied");
  }

  async function exportMarkdown(): Promise<void> {
    if (!selectedGroup || !generatedMarkdown) {
      return;
    }

    setIsExporting(true);
    setExportMessage("");

    try {
      const filePath = await exportWeeklyReportMarkdown(
        selectedGroup.weekId,
        generatedMarkdown,
        projectId
      );
      setExportMessage(`Saved to ${filePath}`);
    } finally {
      setIsExporting(false);
    }
  }

  if (groups.length === 0) {
    return <div className="empty-state">No sessions found</div>;
  }

  return (
    <section className="portfolio-layout" aria-label="Weekly report generator">
      <div className="portfolio-panel">
        <div className="panel-heading">
          <h2>Select Week</h2>
          <span className="small-text">{groups.length} weeks</span>
        </div>

        <label className="sort-field">
          <span>Week</span>
          <select
            className="select-control"
            onChange={(event) => {
              setSelectedWeekId(event.target.value);
              setCopyLabel("Copy");
              setExportMessage("");
            }}
            value={selectedWeekId}
          >
            {groups.map((group) => (
              <option key={group.weekId} value={group.weekId}>
                {group.weekRange} ({group.sessions.length} sessions)
              </option>
            ))}
          </select>
        </label>

        {selectedGroup ? (
          <dl className="usage-grid two-column session-meta standalone">
            <div>
              <dt>Total Sessions</dt>
              <dd>{selectedGroup.sessions.length}</dd>
            </div>
            <div>
              <dt>Changed Files</dt>
              <dd>
                {selectedGroup.sessions.reduce(
                  (total, session) => total + session.changedFilesCount,
                  0
                )}
              </dd>
            </div>
          </dl>
        ) : null}

        <div className="portfolio-actions">
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
          <h2>Weekly Report Preview</h2>
        </div>

        {generatedMarkdown ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {generatedMarkdown}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="preview-placeholder">
            Select a week to generate a weekly development report.
          </p>
        )}
      </div>
    </section>
  );
}
