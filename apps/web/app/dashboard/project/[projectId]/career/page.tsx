import Link from "next/link";
import { getDashboardSessions, resolveProject } from "../../../../../lib/sessions";
import { CareerGenerator } from "./career-generator";

export const dynamic = "force-dynamic";

type CareerPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function CareerPage({ params }: CareerPageProps) {
  const { projectId } = await params;
  const project = resolveProject(projectId);
  const sessions = getDashboardSessions(project.projectId);

  return (
    <main className="page">
      <div className="shell">
        <nav className="nav" aria-label="Main navigation">
          <Link className="brand" href={`/dashboard/project/${project.projectId}`}>
            VibeLog
          </Link>
          <Link
            className="button secondary"
            href={`/dashboard/project/${project.projectId}`}
          >
            Back to Dashboard
          </Link>
        </nav>

        <header className="dashboard-header dashboard-header-row">
          <div>
            <h1>Career Mode</h1>
            <p>
              Generate resume, portfolio, LinkedIn, and interview-ready
              summaries from local project sessions.
            </p>
            <p className="project-label">
              Current project: {project.projectName} ({project.projectId})
            </p>
          </div>
          <div className="session-count">
            <strong>{sessions.length}</strong>
            <span>{sessions.length === 1 ? "session" : "sessions"}</span>
          </div>
        </header>

        <CareerGenerator projectId={project.projectId} />
      </div>
    </main>
  );
}
