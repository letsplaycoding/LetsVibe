import Link from "next/link";
import {
  getAvailableProjects,
  getDashboardSessions,
  getGitMetadata,
  resolveProject
} from "../../lib/sessions";
import { ProjectSelector } from "./project-selector";

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Unknown time";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function projectHref(path: string, projectId: string): string {
  return `${path}?project=${encodeURIComponent(projectId)}`;
}

type DashboardViewProps = {
  projectId?: string;
};

export function DashboardView({ projectId }: DashboardViewProps) {
  const project = resolveProject(projectId);
  const projects = getAvailableProjects();
  const sessions = getDashboardSessions(project.projectId);
  const latestSession = sessions[0] ?? null;
  const gitMetadata = project.isCurrent ? getGitMetadata() : null;
  const repository = gitMetadata?.repository || latestSession?.repository || "";
  const branch = gitMetadata?.branch || latestSession?.branch || "";
  const commitHash = gitMetadata?.commitHash || latestSession?.commitHash || "";

  return (
    <main className="page">
      <div className="shell">
        <nav className="nav" aria-label="Main navigation">
          <a className="brand" href="/">
            VibeLog
          </a>
          <div className="nav-actions">
            <Link
              className="button secondary"
              href={projectHref("/dashboard/overview", project.projectId)}
            >
              Overview
            </Link>
            <Link
              className="button secondary"
              href={projectHref("/dashboard/reports", project.projectId)}
            >
              Reports
            </Link>
            <Link
              className="button secondary"
              href={projectHref("/dashboard/story", project.projectId)}
            >
              Project Story
            </Link>
            <Link
              className="button secondary"
              href={`/dashboard/project/${project.projectId}/chat`}
            >
              AI Chat
            </Link>
            <Link
              className="button secondary"
              href={`/dashboard/project/${project.projectId}/mentor`}
            >
              AI Mentor
            </Link>
            <Link
              className="button secondary"
              href={`/dashboard/project/${project.projectId}/career`}
            >
              Career Mode
            </Link>
            <Link
              className="button secondary"
              href={`/dashboard/project/${project.projectId}/career-timeline`}
            >
              Career Timeline
            </Link>
            <Link
              className="button secondary"
              href={`/dashboard/project/${project.projectId}/interview`}
            >
              Interview Mode
            </Link>
            <Link
              className="button secondary"
              href={`/dashboard/project/${project.projectId}/release-notes`}
            >
              Release Notes
            </Link>
            <Link
              className="button secondary"
              href={projectHref("/dashboard/settings", project.projectId)}
            >
              Settings
            </Link>
            <Link
              className="button secondary"
              href={projectHref("/dashboard/compare", project.projectId)}
            >
              Compare
            </Link>
            <Link
              className="button secondary"
              href={projectHref("/dashboard/search", project.projectId)}
            >
              Search
            </Link>
            <Link
              className="button secondary"
              href={projectHref("/dashboard/timeline", project.projectId)}
            >
              Timeline
            </Link>
            <Link
              className="button secondary"
              href={projectHref("/dashboard/readme", project.projectId)}
            >
              README Generator
            </Link>
            <Link
              className="button secondary"
              href={projectHref("/dashboard/portfolio", project.projectId)}
            >
              Portfolio Generator
            </Link>
          </div>
        </nav>

        <header className="dashboard-header dashboard-header-row">
          <div>
            <h1>VibeLog Dashboard</h1>
            <p>
              LetsVibe turns AI-assisted coding changes into local development
              history you can review, replay, and turn into portfolio-ready
              writing.
            </p>
            <p className="project-label">
              Current project: {project.projectName} ({project.projectId})
            </p>
            {repository || branch || commitHash ? (
              <p className="project-label">
                Repository: {repository || "(unknown)"} · Branch:{" "}
                {branch || "(unknown)"} · Latest commit:{" "}
                {commitHash ? commitHash.slice(0, 7) : "(none)"}
              </p>
            ) : null}
            <ProjectSelector
              currentProjectId={project.projectId}
              projects={projects}
            />
          </div>
          <div className="session-count">
            <strong>{sessions.length}</strong>
            <span>{sessions.length === 1 ? "session" : "sessions"}</span>
          </div>
        </header>

        <section className="feature-grid" aria-label="Dashboard tools">
          <Link
            className="feature-card"
            href={projectHref("/dashboard/timeline", project.projectId)}
          >
            <strong>Timeline</strong>
            <span>Replay development sessions in chronological context.</span>
          </Link>
          <Link
            className="feature-card"
            href={projectHref("/dashboard/search", project.projectId)}
          >
            <strong>Search</strong>
            <span>Find work by feature, note, tag, or changed file.</span>
          </Link>
          <Link
            className="feature-card"
            href={`/dashboard/project/${project.projectId}/release-notes`}
          >
            <strong>Release Notes</strong>
            <span>Generate Added, Improved, and Fixed notes from sessions.</span>
          </Link>
          <Link
            className="feature-card"
            href={`/dashboard/project/${project.projectId}/mentor`}
          >
            <strong>AI Mentor</strong>
            <span>Get practical next-step guidance from project history.</span>
          </Link>
          <Link
            className="feature-card"
            href={`/dashboard/project/${project.projectId}/career-timeline`}
          >
            <strong>Career Timeline</strong>
            <span>Turn sessions into skills and growth by week or month.</span>
          </Link>
          <Link
            className="feature-card"
            href={projectHref("/dashboard/portfolio", project.projectId)}
          >
            <strong>Portfolio</strong>
            <span>Convert selected sessions into portfolio markdown.</span>
          </Link>
        </section>

        <section aria-label="Recent sessions">
          {sessions.length === 0 ? (
            <div className="empty-state">No sessions found</div>
          ) : (
            <div className="session-list">
              {sessions.map((session) => (
                <Link
                  className="session-card"
                  href={projectHref(
                    `/dashboard/session/${session.id}`,
                    project.projectId
                  )}
                  key={session.id}
                >
                  <div>
                    <h2>{session.featureName}</h2>
                    <p>{session.summary}</p>
                    {session.tags.length > 0 ? (
                      <div className="tag-list" aria-label="Session tags">
                        {session.tags.map((tag) => (
                          <span className="tag-pill" key={tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <dl className="session-meta">
                    <div>
                      <dt>Updated</dt>
                      <dd>{formatRelativeTime(session.createdAt)}</dd>
                      <dd className="small-text">{session.createdAt}</dd>
                    </div>
                    <div>
                      <dt>Changed files</dt>
                      <dd>{session.changedFilesCount}</dd>
                    </div>
                  </dl>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
