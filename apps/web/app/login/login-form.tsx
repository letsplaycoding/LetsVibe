"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createBrowserSupabaseClient } from "../../lib/supabase";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setErrorMessage(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Logged in. Opening SaaS dashboard...");
    window.location.href = "/dashboard/saas";
  }

  return (
    <form className="auth-form" onSubmit={submitLogin}>
      <label className="form-field">
        <span>Email</span>
        <input
          autoComplete="email"
          className="text-input"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label className="form-field">
        <span>Password</span>
        <input
          autoComplete="current-password"
          className="text-input"
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      <div className="portfolio-actions">
        <button className="button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        <Link className="button secondary" href="/signup">
          Create Account
        </Link>
      </div>

      {message ? <p className="success-message">{message}</p> : null}
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
    </form>
  );
}
