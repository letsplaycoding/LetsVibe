"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SearchSession } from "../../../lib/sessions";

type SearchFilter = "today" | "week" | "all";
type SearchSort = "newest" | "oldest" | "most-changed";

type SearchViewProps = {
  sessions: SearchSession[];
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

function matchesFilter(session: SearchSession, filter: SearchFilter): boolean {
  if (filter === "all") {
    return true;
  }

  const date = new Date(session.createdAt);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return filter === "today" ? isToday(date) : isThisWeek(date);
}

function matchesQuery(session: SearchSession, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    session.featureName,
    session.summary,
    session.userNote,
    session.portfolioText,
    session.changedFiles.join(" ")
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function sortSessions(
  sessions: SearchSession[],
  sort: SearchSort
): SearchSession[] {
  return [...sessions].sort((a, b) => {
    if (sort === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    if (sort === "most-changed") {
      return b.changedFilesCount - a.changedFilesCount;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function SearchView({ sessions }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [sort, setSort] = useState<SearchSort>("newest");
  const [tagFilter, setTagFilter] = useState("all");
  const availableTags = useMemo(
    () => Array.from(new Set(sessions.flatMap((session) => session.tags))).sort(),
    [sessions]
  );

  const results = useMemo(() => {
    const filteredSessions = sessions.filter(
      (session) =>
        matchesFilter(session, filter) &&
        matchesQuery(session, query) &&
        (tagFilter === "all" || session.tags.includes(tagFilter))
    );

    return sortSessions(filteredSessions, sort);
  }, [filter, query, sessions, sort, tagFilter]);

  function updateTagFilter(value: string): void {
    setTagFilter(value);
  }

  if (sessions.length === 0) {
    return <div className="empty-state">No sessions found</div>;
  }

  return (
    <section aria-label="Session search">
      <div className="search-controls">
        <label className="search-field">
          <span>Search sessions</span>
          <input
            aria-label="Search sessions"
            className="search-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search feature, summary, note, portfolio text, or files"
            type="search"
            value={query}
          />
        </label>

        <label className="sort-field">
          <span>Sort</span>
          <select
            className="select-control"
            onChange={(event) => setSort(event.target.value as SearchSort)}
            value={sort}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="most-changed">Most changed files</option>
          </select>
        </label>
      </div>

      <div className="filter-tabs" role="group" aria-label="Search filters">
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

      {availableTags.length > 0 ? (
        <div className="tag-filter-group">
          <span className="tag-filter-label">Tags</span>
          <div
            className="filter-tabs compact"
            role="group"
            aria-label="Tag filters"
          >
            <button
              className={tagFilter === "all" ? "active" : ""}
              onClick={() => updateTagFilter("all")}
              type="button"
            >
              All tags
            </button>
            {availableTags.map((tag) => (
              <button
                className={tagFilter === tag ? "active" : ""}
                key={tag}
                onClick={() => updateTagFilter(tag)}
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="search-summary">
        Showing {results.length} of {sessions.length} sessions
      </p>

      {results.length === 0 ? (
        <div className="empty-state">No sessions match this search.</div>
      ) : (
        <div className="session-list">
          {results.map((session) => (
            <Link
              className="session-card"
              href={`/dashboard/session/${session.id}?project=${encodeURIComponent(
                session.projectId
              )}`}
              key={session.id}
            >
              <div>
                <h2>{session.featureName}</h2>
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
              </div>
              <dl className="session-meta">
                <div>
                  <dt>Created</dt>
                  <dd>{session.createdAt}</dd>
                </div>
                <div>
                  <dt>Changed files</dt>
                  <dd>{session.changedFilesCount}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
