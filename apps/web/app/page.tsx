import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-page">
      <div className="landing-shell">
        <nav className="nav landing-nav" aria-label="Main navigation">
          <div className="brand">VibeLog</div>
          <div className="nav-actions">
            <Link className="link" href="/dashboard">
              Dashboard
            </Link>
            <Link className="link" href="/login">
              Login
            </Link>
            <a className="link" href="#github">
              GitHub
            </a>
          </div>
        </nav>

        <section className="landing-hero">
          <p className="eyebrow">Local-first developer logs</p>
          <h1>Turn coding sessions into career-ready proof.</h1>
          <p className="landing-description">
            VibeLog helps developers turn local coding work into development
            history, portfolio content, and interview preparation without
            giving up local-first control.
          </p>
          <div className="landing-actions">
            <Link className="button" href="/dashboard">
              Dashboard
            </Link>
            <Link className="button secondary" href="/dashboard/saas">
              Login
            </Link>
            <a className="button secondary" href="#github">
              GitHub
            </a>
          </div>
        </section>

        <section className="landing-band" aria-labelledby="problem-heading">
          <div className="section-copy">
            <p className="eyebrow">Problem</p>
            <h2 id="problem-heading">
              Fast coding sessions are hard to explain later.
            </h2>
          </div>
          <div className="landing-grid three-column">
            <article>
              <h3>Work disappears into diffs</h3>
              <p>
                Git shows what changed, but not why the work mattered or how to
                explain it.
              </p>
            </article>
            <article>
              <h3>Portfolio writing comes too late</h3>
              <p>
                Developers often wait until the end, then struggle to remember
                the strongest contributions.
              </p>
            </article>
            <article>
              <h3>Interview stories lack evidence</h3>
              <p>
                It is easy to describe features vaguely when the actual project
                history is not organized.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-split" aria-labelledby="solution-heading">
          <div className="section-copy">
            <p className="eyebrow">Solution</p>
            <h2 id="solution-heading">
              Capture the work locally, then turn it into useful narratives.
            </h2>
            <p>
              VibeLog reads Git changes, records session notes, saves local JSON
              and Markdown logs, and uses optional AI or mock fallback to help
              explain what you built.
            </p>
          </div>
          <div className="landing-proof">
            <strong>Local-first by default</strong>
            <span>No database migration, no required billing, no cloud sync.</span>
          </div>
        </section>

        <section className="landing-band" aria-labelledby="features-heading">
          <div className="section-copy">
            <p className="eyebrow">Features</p>
            <h2 id="features-heading">From raw code changes to reusable career material.</h2>
          </div>
          <div className="landing-grid four-column">
            {[
              ["Development history", "Session logs, timelines, search, compare, and replay views."],
              ["Portfolio content", "Portfolio, README, career timeline, and weekly report exports."],
              ["Interview preparation", "Interview mode, career mode, AI chat, and mentor guidance."],
              ["Local exports", "JSON, Markdown, backup, and restore workflows stored on disk."]
            ].map(([title, body]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-band" aria-labelledby="screenshots-heading">
          <div className="section-copy">
            <p className="eyebrow">Screenshots</p>
            <h2 id="screenshots-heading">Dashboard preview placeholder</h2>
          </div>
          <div className="screenshot-placeholder" aria-label="Dashboard screenshot placeholder">
            <div className="mock-browser-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="mock-dashboard">
              <aside>
                <strong>VibeLog</strong>
                <span>Sessions</span>
                <span>Portfolio</span>
                <span>Interview</span>
              </aside>
              <div>
                <div className="mock-chart" />
                <div className="mock-card-grid">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-band" aria-labelledby="how-heading">
          <div className="section-copy">
            <p className="eyebrow">How It Works</p>
            <h2 id="how-heading">A simple loop for explainable development.</h2>
          </div>
          <ol className="landing-steps">
            <li>
              <strong>Build locally</strong>
              <span>Work in your Git repository as usual.</span>
            </li>
            <li>
              <strong>Run vibelog end</strong>
              <span>Capture diff, status, changed files, and your note.</span>
            </li>
            <li>
              <strong>Review the dashboard</strong>
              <span>Search sessions, inspect details, and generate exports.</span>
            </li>
            <li>
              <strong>Use the story</strong>
              <span>Turn the work into portfolio and interview-ready material.</span>
            </li>
          </ol>
        </section>

        <section className="landing-cta" aria-labelledby="cta-heading">
          <p className="eyebrow">CTA</p>
          <h2 id="cta-heading">Start with your local history.</h2>
          <p>
            Open the dashboard, record a session, and turn your next coding
            sprint into something you can explain.
          </p>
          <div className="landing-actions">
            <Link className="button" href="/dashboard">
              Dashboard
            </Link>
            <Link className="button secondary" href="/login">
              Login
            </Link>
            <a className="button secondary" href="#github" id="github">
              GitHub
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
