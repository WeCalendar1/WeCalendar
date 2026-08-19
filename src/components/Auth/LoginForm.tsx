"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

function formatAuthError(error: { message?: string; status?: number; code?: string } | null): string {
  const raw = error?.message?.trim() ?? "";
  if (raw && raw !== "{}") return raw;

  if (error?.code) return `Sign up failed (${error.code}). Check Email auth is enabled in Supabase.`;
  if (error?.status) return `Sign up failed (HTTP ${error.status}). Check your Supabase URL and anon/publishable key.`;

  return "Could not create the account. In Supabase: enable Email auth, confirm your project URL/key in .env, and try again.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const authError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("signup");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(
    authError === "auth" ? "Email confirmation failed. Try signing in again." : null,
  );
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim() || undefined,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          console.error("Supabase signUp error:", signUpError);
          setError(formatAuthError(signUpError));
          return;
        }

        // Supabase may return a user with no identities when the email is already registered.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setError("An account with this email already exists. Try signing in instead.");
          setMode("signin");
          return;
        }

        if (data.session) {
          router.replace(nextPath);
          router.refresh();
          return;
        }

        setMessage("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        console.error("Supabase signIn error:", signInError);
        setError(formatAuthError(signInError));
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      console.error("Auth exception:", err);
      setError(err instanceof Error && err.message !== "{}"
        ? err.message
        : "Something went wrong. Check the browser console for details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex rounded-xl p-1" style={{ background: "var(--surface-2)" }}>
        {(
          [
            { id: "signup", label: "Create account" },
            { id: "signin", label: "Sign in" },
          ] as const
        ).map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id);
                setError(null);
                setMessage(null);
              }}
              className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition"
              style={{
                background: active ? "var(--surface)" : "transparent",
                color: active ? "var(--foreground)" : "var(--text-secondary)",
                boxShadow: active ? "var(--shadow-sm)" : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <label htmlFor="display-name" className="text-sm font-semibold">
              Display name
            </label>
            <input
              id="display-name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Rivera"
              maxLength={48}
              className="w-full px-3.5 py-2.5 text-sm outline-none"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1.5px solid var(--border)",
                background: "var(--surface)",
              }}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3.5 py-2.5 text-sm outline-none"
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
            }}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-semibold">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full py-2.5 pr-11 pl-3.5 text-sm outline-none"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1.5px solid var(--border)",
                background: "var(--surface)",
              }}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-0.5 transition-opacity duration-150 hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
              tabIndex={-1}
            >
              {showPassword ? (
                /* Eye-off icon */
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                /* Eye icon */
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>


        {error && (
          <p
            className="rounded-lg px-3 py-2 text-sm"
            style={{ background: "#fef2f2", color: "#b91c1c" }}
            role="alert"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            className="rounded-lg px-3 py-2 text-sm"
            style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}
            role="status"
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-bounce w-full px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            borderRadius: "var(--radius-lg)",
            background: "var(--accent)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {loading
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>
    </div>
  );
}
