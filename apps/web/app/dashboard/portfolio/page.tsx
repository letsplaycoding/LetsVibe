import Link from "next/link";
import { getPortfolioSessions } from "../../../lib/sessions";
import { PortfolioGenerator } from "./portfolio-generator";

export const dynamic = "force-dynamic";

export default function PortfolioPage() {
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
          <h1>Portfolio Generator</h1>
          <p>
            Select local development sessions and generate portfolio-ready
            Markdown without sending data anywhere.
          </p>
        </header>

        <PortfolioGenerator sessions={sessions} />
      </div>
    </main>
  );
}
