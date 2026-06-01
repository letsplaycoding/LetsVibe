import Link from "next/link";
import { AuthenticatedDashboardShell } from "./authenticated-dashboard-shell";

export default function SaasDashboardPage() {
  return (
    <main className="page">
      <div className="shell">
        <nav className="nav" aria-label="Main navigation">
          <Link className="brand" href="/">
            VibeLog
          </Link>
          <div className="nav-actions">
            <Link className="button secondary" href="/dashboard">
              Local Dashboard
            </Link>
            <Link className="button secondary" href="/login">
              Login
            </Link>
          </div>
        </nav>

        <header className="dashboard-header">
          <h1>SaaS Dashboard</h1>
          <p>
            Authentication foundation for future public SaaS usage. Local
            .vibelog project history remains separate and local-first.
          </p>
        </header>

        <AuthenticatedDashboardShell />
      </div>
    </main>
  );
}
