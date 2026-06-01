import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
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
          <h1>Login</h1>
          <p className="description">
            Sign in to the SaaS shell. Local .vibelog dashboards continue to
            work without an account.
          </p>
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
