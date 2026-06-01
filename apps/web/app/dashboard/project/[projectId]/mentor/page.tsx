import Link from "next/link";
import { getDashboardSessions, resolveProject } from "../../../../../lib/sessions";
import { MentorGenerator } from "./mentor-generator";

export const dynamic = "force-dynamic";

type MentorPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function MentorPage({ params }: MentorPageProps) {
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
            <h1>AI Mentor</h1>
            <p>
              Review project history for development direction, technical debt,
              risk patterns, testing gaps, documentation gaps, and next actions.
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

        <MentorGenerator
          projectId={project.projectId}
          sessionCount={sessions.length}
        />
      </div>
    </main>
  );
}
