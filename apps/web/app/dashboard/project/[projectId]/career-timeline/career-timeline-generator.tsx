"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readStoredLanguage } from "../../../../../app/language-client";
import {
  exportCareerTimelineMarkdown,
  generateCareerTimelineMarkdown,
  type TimelineGrouping
} from "./actions";

type TimelineGroup = {
  period: string;
  sessions: Array<{
    id: string;
    featureName: string;
    summary: string;
    changedFilesCount: number;
    tags: string[];
  }>;
};

type CareerTimelineGeneratorProps = {
  projectId: string;
  sessionCount: number;
  weekGroups: TimelineGroup[];
  monthGroups: TimelineGroup[];
};

export function CareerTimelineGenerator({
  projectId,
  sessionCount,
  weekGroups,
  monthGroups
}: CareerTimelineGeneratorProps) {
  const [grouping, setGrouping] = useState<TimelineGrouping>("week");
  const [markdown, setMarkdown] = useState("");
  const [provider, setProvider] = useState<"openai" | "mock" | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [exportMessage, setExportMessage] = useState("");
  const [isGenerating, startGenerateTransition] = useTransition();
  const [isExporting, startExportTransition] = useTransition();
  const groups = grouping === "month" ? monthGroups : weekGroups;

  function generate(): void {
    setCopyLabel("Copy");
    setExportMessage("");

    startGenerateTransition(async () => {
      const result = await generateCareerTimelineMarkdown(
        projectId,
        grouping,
        readStoredLanguage()
      );
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
      const filePath = await exportCareerTimelineMarkdown(projectId, markdown);
      setExportMessage(`Saved to ${filePath}`);
    });
  }

  return (
    <section className="portfolio-layout" aria-label="Career timeline">
      <div className="portfolio-panel">
        <div className="panel-heading">
          <h2>Career Timeline</h2>
          {provider ? <span className="tag-pill">{provider}</span> : null}
        </div>
        <p className="preview-placeholder">
          Group project sessions into career-oriented periods with key work,
          skills, technical growth, and portfolio-ready bullets.
        </p>

        <label className="sort-field">
          <span>Group By</span>
          <select
            className="select-control"
            onChange={(event) => {
              setGrouping(event.target.value as TimelineGrouping);
              setCopyLabel("Copy");
              setExportMessage("");
            }}
            value={grouping}
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </label>

        <dl className="usage-grid two-column compact-stats">
          <div>
            <dt>Source sessions</dt>
            <dd>{sessionCount}</dd>
          </div>
          <div>
            <dt>Periods</dt>
            <dd>{groups.length}</dd>
          </div>
        </dl>

        <div className="portfolio-actions">
          <button
            className="button"
            disabled={isGenerating}
            onClick={generate}
            type="button"
          >
            {isGenerating ? "Generating..." : "Generate Career Timeline"}
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
            No sessions found yet. Run the CLI first, then generate a career
            timeline from saved local history.
          </p>
        ) : null}
      </div>

      <div className="portfolio-panel">
        <div className="panel-heading">
          <h2>Timeline View</h2>
          <span className="tag-pill">{grouping}</span>
        </div>

        {groups.length === 0 ? (
          <p className="preview-placeholder">No timeline periods to show.</p>
        ) : (
          <div className="timeline-list">
            {groups.map((group) => (
              <article className="timeline-entry" key={group.period}>
                <div className="timeline-date">{group.period}</div>
                <div>
                  {group.sessions.map((session) => (
                    <div className="timeline-session" key={session.id}>
                      <h3>{session.featureName}</h3>
                      <p>{session.summary}</p>
                      <p className="small-text">
                        {session.changedFilesCount} changed files
                      </p>
                      {session.tags.length > 0 ? (
                        <div className="tag-list" aria-label="Session tags">
                          {session.tags.slice(0, 5).map((tag) => (
                            <span className="tag-pill" key={tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="portfolio-panel preview-panel">
        <div className="panel-heading">
          <h2>Career Timeline Preview</h2>
          {isGenerating ? <span className="tag-pill">generating</span> : null}
        </div>

        {isGenerating ? (
          <p className="preview-placeholder">
            Reading local sessions and preparing the career timeline...
          </p>
        ) : markdown ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        ) : (
          <p className="preview-placeholder">
            Generated markdown will include key work, skills demonstrated,
            technical growth, and portfolio-ready bullet points.
          </p>
        )}
      </div>
    </section>
  );
}
