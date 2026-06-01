import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="page">
      <div className="shell auth-shell">
        <nav className="nav" aria-label="Main navigation">
          <Link className="brand" href="/">
            VibeLog
          </Link>
          <Link className="button secondary" href="/dashboard">
            Local Dashboard
          </Link>
        </nav>

        <section className="detail-panel auth-card">
          <p className="eyebrow">SaaS foundation</p>
          <h1>Sign Up</h1>
          <p className="description">
            Create a Supabase-backed account for future SaaS features. Local
            project data stays on disk.
          </p>
          <SignupForm />
        </section>
      </div>
    </main>
  );
}
