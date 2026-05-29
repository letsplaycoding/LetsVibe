import Link from "next/link";
import { getPortfolioSessions } from "../../../lib/sessions";
import { PortfolioGenerator } from "./portfolio-generator";

export const dynamic = "force-dynamic";

type PortfolioPageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

export default async function PortfolioPage({ searchParams }: PortfolioPageProps) {
  const { project } = await searchParams;
  const sessions = getPortfolioSessions(project);
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
          <h1>Portfolio Generator</h1>
          <p>
            Select local development sessions and generate portfolio-ready
            Markdown without sending data anywhere.
          </p>
        </header>

        <PortfolioGenerator sessions={sessions} projectId={project} />
      </div>
    </main>
  );
}
