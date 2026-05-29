import Link from "next/link";
import { getDashboardSessions } from "../../../lib/sessions";
import { TimelineView } from "./timeline-view";

export const dynamic = "force-dynamic";

type TimelinePageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const { project } = await searchParams;
  const sessions = getDashboardSessions(project);
  const dashboardHref = project ? `/dashboard/project/${project}` : "/dashboard";

  return (
    <main className="page">
      <div className="shell">
        <nav className="nav" aria-label="Main navigation">
          <Link className="brand" href={dashboardHref}>
            VibeLog
          </Link>
          <Link className="button secondary" href={dashboardHref}>
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
