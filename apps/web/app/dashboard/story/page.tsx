import Link from "next/link";
import { generateProjectStoryMarkdown } from "./actions";
import { StoryViewer } from "./story-viewer";

export const dynamic = "force-dynamic";

export default async function StoryPage() {
  const story = await generateProjectStoryMarkdown();

  return (
    <main className="page">
      <div className="shell">
        <nav className="nav" aria-label="Main navigation">
          <Link className="brand" href="/dashboard">
            VibeLog
          </Link>
          <Link className="button secondary" href="/dashboard">
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
          provider={story.provider}
        />
      </div>
    </main>
  );
}
