import Link from "next/link";
import { getOverviewSummary } from "../../../lib/sessions";

export const dynamic = "force-dynamic";

function formatCost(value: number): string {
  return `$${value.toFixed(6)}`;
}

export default function OverviewPage() {
  const overview = getOverviewSummary();

  return (
    <main className="page">
      <div className="shell">
        <nav className="nav" aria-label="Main navigation">
          <Link className="brand" href="/dashboard">
            VibeLog
          </Link>
          <Link className="button secondary" href="/dashboard">
            Back to Dashboard
          </Link>
        </nav>

        <header className="dashboard-header">
          <h1>Project Overview</h1>
          <p>
            Local project stats generated from saved VibeLog sessions.
          </p>
        </header>

        <section className="overview-grid" aria-label="Project stats">
          <article className="stat-card">
            <span>Total sessions</span>
            <strong>{overview.totalSessions}</strong>
          </article>
          <article className="stat-card">
            <span>Total changed files</span>
            <strong>{overview.totalChangedFiles}</strong>
          </article>
          <article className="stat-card">
            <span>Total token usage</span>
            <strong>{overview.totalTokens}</strong>
          </article>
          <article className="stat-card">
            <span>Estimated total cost</span>
            <strong>{formatCost(overview.estimatedTotalCostUsd)}</strong>
          </article>
          <article className="stat-card">
            <span>Most active day</span>
            <strong>{overview.mostActiveDay?.date ?? "None"}</strong>
            <small>
              {overview.mostActiveDay
                ? `${overview.mostActiveDay.count} sessions`
                : "No sessions"}
            </small>
          </article>
        </section>

        <section className="detail-grid overview-sections" aria-label="Activity stats">
          <article className="detail-panel">
            <h2>Top Tags</h2>
            {overview.topTags.length === 0 ? (
              <p>None</p>
            ) : (
              <div className="tag-list compact">
                {overview.topTags.map((tag) => (
                  <span className="tag-pill" key={tag.tag}>
                    {tag.tag} · {tag.count}
                  </span>
                ))}
              </div>
            )}
          </article>

          <article className="detail-panel">
            <h2>Recent Activity</h2>
            {overview.recentActivity.length === 0 ? (
              <p>No sessions found</p>
            ) : (
              <div className="activity-list">
                {overview.recentActivity.map((session) => (
                  <Link
                    className="activity-item"
                    href={`/dashboard/session/${session.id}`}
                    key={session.id}
                  >
                    <strong>{session.featureName}</strong>
                    <span>{session.createdAt}</span>
                    <p>{session.summary || "(empty)"}</p>
                  </Link>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
