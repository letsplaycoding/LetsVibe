import Link from "next/link";
import {
  getDashboardSessions,
  getGitMetadata,
  resolveProject
} from "../../../../../lib/sessions";
import { ReleaseNotesGenerator } from "./release-notes-generator";

export const dynamic = "force-dynamic";

type ReleaseNotesPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ReleaseNotesPage({
  params
}: ReleaseNotesPageProps) {
  const { projectId } = await params;
  const project = resolveProject(projectId);
  const sessions = getDashboardSessions(project.projectId);
  const latestSession = sessions[0] ?? null;
  const gitMetadata = project.isCurrent ? getGitMetadata() : null;
  const repository =
    gitMetadata?.repository || latestSession?.repository || project.projectName;
  const branch = gitMetadata?.branch || latestSession?.branch || "";
  const commitHash = gitMetadata?.commitHash || latestSession?.commitHash || "";

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
            <h1>Release Notes</h1>
            <p>
              Turn recent local sessions into concise release notes grouped by
              Added, Improved, and Fixed.
            </p>
            <p className="project-label">
              Repository: {repository} · Branch: {branch || "(unknown)"} ·
              Latest commit: {commitHash ? commitHash.slice(0, 7) : "(none)"}
            </p>
          </div>
          <div className="session-count">
            <strong>{sessions.length}</strong>
            <span>{sessions.length === 1 ? "session" : "sessions"}</span>
          </div>
        </header>

        <ReleaseNotesGenerator
          projectId={project.projectId}
          sessionCount={sessions.length}
        />
      </div>
    </main>
  );
}
