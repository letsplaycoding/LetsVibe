import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getDashboardSession } from "../../../../lib/sessions";

export const dynamic = "force-dynamic";

type SessionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const session = getDashboardSession(id);

  return (
    <main className="page">
      <div className="shell">
        <nav className="nav" aria-label="Main navigation">
          <Link className="brand" href="/dashboard">
            VibeLog
          </Link>
        </nav>

        {session ? (
          <>
            <section className="dashboard-header">
              <h1>{session.featureName}</h1>
              <p>{session.summary}</p>
              <dl className="session-meta standalone">
                <div>
                  <dt>Created</dt>
                  <dd>{session.createdAt}</dd>
                </div>
                <div>
                  <dt>Changed files</dt>
                  <dd>{session.changedFilesCount}</dd>
                </div>
              </dl>
            </section>

            <section className="detail-grid" aria-label="Session details">
              <article className="detail-panel">
                <h2>User Note</h2>
                <p>{session.userNote || "(empty)"}</p>
              </article>

              <article className="detail-panel">
                <h2>Changed Files</h2>
                {session.changedFiles.length === 0 ? (
                  <p>None</p>
                ) : (
                  <ul>
                    {session.changedFiles.map((file) => (
                      <li key={file}>{file}</li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="detail-panel">
                <h2>Risks</h2>
                {session.risks.length === 0 ? (
                  <p>None</p>
                ) : (
                  <ul>
                    {session.risks.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="detail-panel">
                <h2>Todos</h2>
                {session.todos.length === 0 ? (
                  <p>None</p>
                ) : (
                  <ul>
                    {session.todos.map((todo) => (
                      <li key={todo}>{todo}</li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="detail-panel wide">
                <h2>Portfolio Text</h2>
                <p>{session.portfolioText || "(empty)"}</p>
              </article>

              <article className="detail-panel wide">
                <h2>Markdown Preview</h2>
                {session.markdownPreview ? (
                  <div className="markdown-preview">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {session.markdownPreview}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>No markdown log found.</p>
                )}
              </article>
            </section>
          </>
        ) : (
          <div className="empty-state">No session found</div>
        )}
      </div>
    </main>
  );
}
