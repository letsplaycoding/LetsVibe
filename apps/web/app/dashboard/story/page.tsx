import Link from "next/link";
import { generateProjectStoryMarkdown } from "./actions";
import { StoryViewer } from "./story-viewer";

export const dynamic = "force-dynamic";

type StoryPageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

export default async function StoryPage({ searchParams }: StoryPageProps) {
  const { project } = await searchParams;
  const story = await generateProjectStoryMarkdown(project);
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
          <h1>AI Project Story</h1>
          <p>
            Generate a project evolution narrative from local VibeLog sessions.
          </p>
        </header>

        <StoryViewer
          initialMarkdown={story.markdown}
          projectId={project}
          provider={story.provider}
        />
      </div>
    </main>
  );
}
