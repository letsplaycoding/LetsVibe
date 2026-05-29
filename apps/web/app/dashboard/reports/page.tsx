import Link from "next/link";
import { getWeeklyReportGroups } from "../../../lib/sessions";
import { WeeklyReportGenerator } from "./weekly-report-generator";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  const groups = getWeeklyReportGroups();

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
          <h1>Weekly Reports</h1>
          <p>
            Generate local weekly development reports from saved VibeLog
            sessions.
          </p>
        </header>

        <WeeklyReportGenerator groups={groups} />
      </div>
    </main>
  );
}
