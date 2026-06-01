import Link from "next/link";
import {
  getSearchSessions,
  resolveProject,
  type SearchSession
} from "../../../../../lib/sessions";
import { CareerTimelineGenerator } from "./career-timeline-generator";

export const dynamic = "force-dynamic";

type CareerTimelinePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

type TimelineGroup = {
  period: string;
  sessions: Array<{
    id: string;
    featureName: string;
    summary: string;
    changedFilesCount: number;
    tags: string[];
  }>;
};

function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  weekStart.setDate(weekStart.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  return weekStart;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getPeriodLabel(value: string, grouping: "week" | "month"): string {
  const date = new Date(value);
  const validDate = Number.isNaN(date.getTime()) ? new Date(0) : date;

  if (grouping === "month") {
    return validDate.toISOString().slice(0, 7);
  }

  const weekStart = getWeekStart(validDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return `${formatDate(weekStart)} to ${formatDate(weekEnd)}`;
}

function groupSessions(
  sessions: SearchSession[],
  grouping: "week" | "month"
): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();

  for (const session of sessions) {
    const period = getPeriodLabel(session.createdAt, grouping);
    const item = {
      id: session.id,
      featureName: session.featureName,
      summary: session.summary,
      changedFilesCount: session.changedFilesCount,
      tags: session.tags
    };
    const existingGroup = groups.get(period);

    if (existingGroup) {
      existingGroup.sessions.push(item);
      continue;
    }

    groups.set(period, {
      period,
      sessions: [item]
    });
  }

  return Array.from(groups.values()).sort((a, b) =>
    b.period.localeCompare(a.period)
  );
}

export default async function CareerTimelinePage({
  params
}: CareerTimelinePageProps) {
  const { projectId } = await params;
  const project = resolveProject(projectId);
  const sessions = getSearchSessions(project.projectId);

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
            <h1>Career Timeline</h1>
            <p>
              Convert project sessions into a career-oriented timeline with key
              work, skills demonstrated, technical growth, and portfolio-ready
              bullet points.
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

        <CareerTimelineGenerator
          monthGroups={groupSessions(sessions, "month")}
          projectId={project.projectId}
          sessionCount={sessions.length}
          weekGroups={groupSessions(sessions, "week")}
        />
      </div>
    </main>
  );
}
