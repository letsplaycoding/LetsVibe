import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <div className="shell">
        <nav className="nav" aria-label="Main navigation">
          <div className="brand">VibeLog</div>
          <div className="nav-actions">
            <Link className="link" href="/dashboard">
              Dashboard
            </Link>
            <Link className="link" href="/login">
              Login
            </Link>
          </div>
        </nav>

        <section className="hero">
          <p className="eyebrow">Local-first developer logs</p>
          <h1>VibeLog</h1>
          <p className="description">
            Turn AI-assisted coding sessions into readable development history,
            Markdown logs, and portfolio-ready summaries.
          </p>
          <div className="portfolio-actions">
            <Link className="button" href="/dashboard">
              Open Local Dashboard
            </Link>
            <Link className="button secondary" href="/dashboard/saas">
              Open SaaS Shell
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
