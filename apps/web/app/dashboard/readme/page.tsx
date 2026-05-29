import Link from "next/link";
import { getPortfolioSessions } from "../../../lib/sessions";
import { ReadmeGenerator } from "./readme-generator";

export const dynamic = "force-dynamic";

type ReadmePageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

export default async function ReadmePage({ searchParams }: ReadmePageProps) {
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
          <h1>README Generator</h1>
          <p>
            Select local sessions and generate a project README without sending
            data anywhere.
          </p>
        </header>

        <ReadmeGenerator sessions={sessions} projectId={project} />
      </div>
    </main>
  );
}
