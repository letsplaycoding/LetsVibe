import Link from "next/link";
import { getSearchSessions } from "../../../lib/sessions";
import { SearchView } from "./search-view";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  const sessions = getSearchSessions();

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
          <h1>Session Search</h1>
          <p>
            Search local development sessions by note, summary, portfolio text,
            and changed files.
          </p>
        </header>

        <SearchView sessions={sessions} />
      </div>
    </main>
  );
}
