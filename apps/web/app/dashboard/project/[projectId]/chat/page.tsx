import Link from "next/link";
import { getDashboardSessions, resolveProject } from "../../../../../lib/sessions";
import { ChatView } from "./chat-view";

export const dynamic = "force-dynamic";

type ProjectChatPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectChatPage({ params }: ProjectChatPageProps) {
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
            <h1>AI Chat</h1>
            <p>
              Ask questions about local development history for{" "}
              {project.projectName}.
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

        <ChatView projectId={project.projectId} sessionCount={sessions.length} />
      </div>
    </main>
  );
}
