"use client";

import { useMemo, useState } from "react";
import type { DashboardSession } from "../../../lib/sessions";

type TimelineFilter = "today" | "week" | "all";

type TimelineViewProps = {
  sessions: DashboardSession[];
};

function isToday(date: Date): boolean {
  const now = new Date();

  return date.toDateString() === now.toDateString();
}

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  return date >= weekAgo && date <= now;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function filterSessions(
  sessions: DashboardSession[],
  filter: TimelineFilter
): DashboardSession[] {
  if (filter === "all") {
    return sessions;
  }

  return sessions.filter((session) => {
    const date = new Date(session.createdAt);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return filter === "today" ? isToday(date) : isThisWeek(date);
  });
}

function groupByDate(
  sessions: DashboardSession[]
): Array<[string, DashboardSession[]]> {
  const groups = new Map<string, DashboardSession[]>();

  for (const session of sessions) {
    const dateLabel = formatDate(session.createdAt);
    groups.set(dateLabel, [...(groups.get(dateLabel) ?? []), session]);
  }

  return Array.from(groups.entries());
}

export function TimelineView({ sessions }: TimelineViewProps) {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const groupedSessions = useMemo(
    () => groupByDate(filterSessions(sessions, filter)),
    [filter, sessions]
  );

  if (sessions.length === 0) {
    return <div className="empty-state">No sessions found</div>;
  }

  return (
    <section aria-label="Timeline view">
      <div className="filter-tabs" role="group" aria-label="Timeline filters">
        <button
          className={filter === "today" ? "active" : ""}
          onClick={() => setFilter("today")}
          type="button"
        >
          Today
        </button>
        <button
          className={filter === "week" ? "active" : ""}
          onClick={() => setFilter("week")}
          type="button"
        >
          This Week
        </button>
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
          type="button"
        >
          All
        </button>
      </div>

      {groupedSessions.length === 0 ? (
        <div className="empty-state">No sessions found for this filter.</div>
      ) : (
        <div className="timeline">
          {groupedSessions.map(([dateLabel, dateSessions]) => (
            <section className="timeline-day" key={dateLabel}>
              <h2>{dateLabel}</h2>
              <div className="timeline-entries">
                {dateSessions.map((session) => (
                  <article className="timeline-entry" key={session.id}>
                    <time>{formatTime(session.createdAt)}</time>
                    <div>
                      <h3>{session.featureName}</h3>
                      <p>{session.summary}</p>
                      {session.tags.length > 0 ? (
                        <div className="tag-list" aria-label="Session tags">
                          {session.tags.map((tag) => (
                            <span className="tag-pill" key={tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <span>{session.changedFilesCount} changed files</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
