import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getDashboardSession } from "../../../../lib/sessions";
import { DiffViewer } from "./diff-viewer";
import { SessionEditor } from "./session-editor";

export const dynamic = "force-dynamic";

type SessionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    project?: string;
  }>;
};

function formatRelativePath(filePath: string): string {
  const parts = filePath.split(/[\\/]/).filter(Boolean);

  return parts.at(-1) ?? filePath;
}

function formatCost(value: number): string {
  return `$${value.toFixed(6)}`;
}

export default async function SessionPage({
  params,
  searchParams
}: SessionPageProps) {
  const { id } = await params;
  const { project } = await searchParams;
  const session = getDashboardSession(id, project);
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
              <SessionEditor session={session} />

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
                      <li key={file} title={file}>
                        {formatRelativePath(file)}
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="detail-panel">
                <div className="panel-heading">
                  <h2>Risks</h2>
                  <span className="badge badge-risk">{session.risks.length}</span>
                </div>
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
                <div className="panel-heading">
                  <h2>Todos</h2>
                  <span className="badge badge-todo">{session.todos.length}</span>
                </div>
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
                <h2>Future Improvements</h2>
                {session.futureImprovements.length === 0 ? (
                  <p>None</p>
                ) : (
                  <ul>
                    {session.futureImprovements.map((improvement) => (
                      <li key={improvement}>{improvement}</li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="detail-panel wide">
                <h2>AI Usage</h2>
                <dl className="usage-grid">
                  <div>
                    <dt>Provider</dt>
                    <dd>{session.aiUsage.provider}</dd>
                  </div>
                  <div>
                    <dt>Model</dt>
                    <dd>{session.aiUsage.model}</dd>
                  </div>
                  <div>
                    <dt>Input tokens</dt>
                    <dd>{session.aiUsage.inputTokens}</dd>
                  </div>
                  <div>
                    <dt>Output tokens</dt>
                    <dd>{session.aiUsage.outputTokens}</dd>
                  </div>
                  <div>
                    <dt>Total tokens</dt>
                    <dd>{session.aiUsage.totalTokens}</dd>
                  </div>
                  <div>
                    <dt>Estimated cost</dt>
                    <dd>{formatCost(session.aiUsage.estimatedCostUsd)}</dd>
                  </div>
                </dl>
              </article>

              <article className="detail-panel wide">
                <h2>Git Status</h2>
                <pre className="code-block">
                  <code>{session.gitStatus || "(clean)"}</code>
                </pre>
              </article>

              <article className="detail-panel wide">
                <h2>Git Diff</h2>
                <DiffViewer diff={session.gitDiff} />
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
