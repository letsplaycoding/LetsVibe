import Link from "next/link";
import { getDashboardSessions } from "../../../lib/sessions";
import { TimelineView } from "./timeline-view";

export const dynamic = "force-dynamic";

export default function TimelinePage() {
  const sessions = getDashboardSessions();

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
          <h1>Timeline</h1>
          <p>
            Review local development sessions grouped by date, newest first.
          </p>
        </header>

        <TimelineView sessions={sessions} />
      </div>
    </main>
  );
}
