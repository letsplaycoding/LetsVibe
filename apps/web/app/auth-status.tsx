"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured
} from "../lib/supabase";

type AuthStatusProps = {
  mode?: "compact" | "panel";
};

export function AuthStatus({ mode = "panel" }: AuthStatusProps) {
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

  async function logout(): Promise<void> {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
  }

  if (mode === "compact") {
    if (isLoading) {
      return <span className="tag-pill">Checking auth</span>;
    }

    return user ? (
      <button className="button secondary" onClick={logout} type="button">
        Logout
      </button>
    ) : (
      <Link className="button secondary" href="/login">
        Login
      </Link>
    );
  }

  return (
    <article className="detail-panel">
      <div className="panel-heading">
        <h2>Authentication</h2>
        <span className="tag-pill">
          {configured ? (user ? "Logged in" : "Logged out") : "Not configured"}
        </span>
      </div>
      <dl className="usage-grid two-column">
        <div>
          <dt>Supabase</dt>
          <dd>{configured ? "Configured" : "Not configured"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user?.email ?? "Not logged in"}</dd>
        </div>
      </dl>
      <p className="settings-note">
        Authentication is only used for future SaaS pages. Local dashboard data
        still comes from .vibelog files.
      </p>
      <div className="portfolio-actions">
        {user ? (
          <button className="button secondary" onClick={logout} type="button">
            Logout
          </button>
        ) : (
          <>
            <Link className="button" href="/login">
              Login
            </Link>
            <Link className="button secondary" href="/signup">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </article>
  );
}
