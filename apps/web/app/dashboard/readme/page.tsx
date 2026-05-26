import Link from "next/link";
import { getPortfolioSessions } from "../../../lib/sessions";
import { ReadmeGenerator } from "./readme-generator";

export const dynamic = "force-dynamic";

export default function ReadmePage() {
  const sessions = getPortfolioSessions();

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
          <h1>README Generator</h1>
          <p>
            Select local sessions and generate a project README without sending
            data anywhere.
          </p>
        </header>

        <ReadmeGenerator sessions={sessions} />
      </div>
    </main>
  );
}
