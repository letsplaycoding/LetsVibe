"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured
} from "../../../lib/supabase";
import { AuthStatus } from "../../auth-status";

export function AuthenticatedDashboardShell() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <div className="loading-panel">Checking authentication...</div>;
  }

  if (!configured) {
    return (
      <section className="detail-panel auth-card">
        <h2>Supabase is not configured</h2>
        <p>
          Add Supabase environment variables to enable the SaaS shell. The local
          dashboard remains available without authentication.
        </p>
        <pre className="code-block">{`NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=`}</pre>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="detail-panel auth-card">
        <h2>Login required</h2>
        <p>
          This is a SaaS-only page. Sign in to continue, or use the local
          dashboard without an account.
        </p>
        <div className="portfolio-actions">
          <Link className="button" href="/login">
            Login
          </Link>
          <Link className="button secondary" href="/signup">
            Sign Up
          </Link>
          <Link className="button secondary" href="/dashboard">
            Local Dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="detail-grid" aria-label="Authenticated dashboard shell">
      <article className="detail-panel wide">
        <div className="panel-heading">
          <h2>Authenticated Dashboard</h2>
          <AuthStatus mode="compact" />
        </div>
        <p>
          Signed in as <strong>{user.email}</strong>. Cloud sync, team features,
          and billing are intentionally not enabled yet.
        </p>
      </article>

      <article className="detail-panel">
        <h2>Local-first status</h2>
        <p>
          Project history still reads from local .vibelog files. No local data
          is migrated to Supabase in this phase.
        </p>
      </article>

      <article className="detail-panel">
        <h2>Future SaaS readiness</h2>
        <p>
          Authentication is ready for future cloud sync and account-scoped
          features, without changing CLI behavior.
        </p>
      </article>
    </section>
  );
}
