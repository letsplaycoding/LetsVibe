"use client";

import { useMemo, useState } from "react";
import type { CompareSession } from "../../../lib/sessions";

type CompareViewProps = {
  sessions: CompareSession[];
};

function formatCost(value: number): string {
  return `$${value.toFixed(6)}`;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function getSessionLabel(session: CompareSession): string {
  return `${session.featureName} - ${session.createdAt}`;
}

function getFileComparison(left: CompareSession, right: CompareSession) {
  const leftFiles = new Set(left.changedFiles);
  const rightFiles = new Set(right.changedFiles);

  return {
    added: uniqueSorted(right.changedFiles.filter((file) => !leftFiles.has(file))),
    removed: uniqueSorted(left.changedFiles.filter((file) => !rightFiles.has(file))),
    common: uniqueSorted(left.changedFiles.filter((file) => rightFiles.has(file)))
  };
}

function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return <p>None</p>;
  }

  return (
    <div className="tag-list compact">
      {tags.map((tag) => (
        <span className="tag-pill" key={tag}>
          {tag}
        </span>
      ))}
    </div>
  );
}

function FileList({ files }: { files: string[] }) {
  if (files.length === 0) {
    return <p>None</p>;
  }

  return (
    <ul>
      {files.map((file) => (
        <li key={file}>{file}</li>
      ))}
    </ul>
  );
}

export function CompareView({ sessions }: CompareViewProps) {
  const [leftId, setLeftId] = useState(sessions[0]?.id ?? "");
  const [rightId, setRightId] = useState(sessions[1]?.id ?? sessions[0]?.id ?? "");
  const leftSession = sessions.find((session) => session.id === leftId) ?? null;
  const rightSession = sessions.find((session) => session.id === rightId) ?? null;
  const fileComparison = useMemo(() => {
    if (!leftSession || !rightSession) {
      return {
        added: [],
        removed: [],
        common: []
      };
    }

    return getFileComparison(leftSession, rightSession);
  }, [leftSession, rightSession]);

  if (sessions.length === 0) {
    return <div className="empty-state">No sessions found</div>;
  }

  if (sessions.length < 2) {
    return <div className="empty-state">At least two sessions are needed to compare.</div>;
  }

  return (
    <section aria-label="Session comparison">
      <div className="compare-controls">
        <label>
          <span>First session</span>
          <select
            className="select-control"
            onChange={(event) => setLeftId(event.target.value)}
            value={leftId}
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {getSessionLabel(session)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Second session</span>
          <select
            className="select-control"
            onChange={(event) => setRightId(event.target.value)}
            value={rightId}
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {getSessionLabel(session)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {leftSession && rightSession ? (
        <>
          <div className="compare-grid">
            {[leftSession, rightSession].map((session) => (
              <article className="detail-panel" key={session.id}>
                <h2>{session.featureName}</h2>
                <dl className="compare-list">
                  <div>
                    <dt>Created</dt>
                    <dd>{session.createdAt}</dd>
                  </div>
                  <div>
                    <dt>Summary</dt>
                    <dd>{session.summary || "(empty)"}</dd>
                  </div>
                  <div>
                    <dt>Changed files</dt>
                    <dd>{session.changedFilesCount}</dd>
                  </div>
                  <div>
                    <dt>Tags</dt>
                    <dd>
                      <TagList tags={session.tags} />
                    </dd>
                  </div>
                  <div>
                    <dt>Token usage</dt>
                    <dd>{session.aiUsage.totalTokens}</dd>
                  </div>
                  <div>
                    <dt>Estimated cost</dt>
                    <dd>{formatCost(session.aiUsage.estimatedCostUsd)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <article className="detail-panel wide compare-files">
            <h2>Changed File Comparison</h2>
            <div className="compare-grid three-column">
              <section>
                <h3>Added</h3>
                <FileList files={fileComparison.added} />
              </section>
              <section>
                <h3>Removed</h3>
                <FileList files={fileComparison.removed} />
              </section>
              <section>
                <h3>Common</h3>
                <FileList files={fileComparison.common} />
              </section>
            </div>
          </article>
        </>
      ) : (
        <div className="empty-state">Select two sessions to compare.</div>
      )}
    </section>
  );
}
