import Link from "next/link";
import { getDashboardSessions, resolveProject } from "../../../../../lib/sessions";
import { InterviewGenerator } from "./interview-generator";

export const dynamic = "force-dynamic";

type InterviewPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function InterviewPage({ params }: InterviewPageProps) {
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
            <h1>Interview Mode</h1>
            <p>
              Practice project interviews with generated questions, suggested
              answers, follow-ups, key points, mistakes to avoid, and answer
              evaluation.
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

        <InterviewGenerator projectId={project.projectId} />
      </div>
    </main>
  );
}
