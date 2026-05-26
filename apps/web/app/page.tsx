import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <div className="shell">
        <nav className="nav" aria-label="Main navigation">
          <div className="brand">VibeLog</div>
          <Link className="link" href="/dashboard">
            Dashboard
          </Link>
        </nav>

        <section className="hero">
          <p className="eyebrow">Local-first developer logs</p>
          <h1>VibeLog</h1>
          <p className="description">
            Turn AI-assisted coding sessions into readable development history,
            Markdown logs, and portfolio-ready summaries.
          </p>
          <Link className="button" href="/dashboard">
            Open Dashboard
          </Link>
        </section>
      </div>
    </main>
  );
}
