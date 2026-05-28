import Link from "next/link";
import { getCompareSessions } from "../../../lib/sessions";
import { CompareView } from "./compare-view";

export const dynamic = "force-dynamic";

export default function ComparePage() {
  const sessions = getCompareSessions();

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
          <h1>Session Compare</h1>
          <p>
            Select two local sessions and compare their summaries, files, tags,
            and AI usage.
          </p>
        </header>

        <CompareView sessions={sessions} />
      </div>
    </main>
  );
}
