"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isPasswordValid, validatePasswordRules } from "@/lib/auth";
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

  // Password strength rules - derived from current value, no extra state needed
  const pwRules = validatePasswordRules(password);
  const pwAllValid = isPasswordValid(password);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        if (!pwAllValid) {
          setError("Please satisfy all password requirements before continuing.");
          setLoading(false);
          return;
        }
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
      <div
        className="grid grid-cols-2 gap-1 p-1 text-sm font-medium"
        style={{
          borderRadius: "var(--radius-lg)",
          background: "var(--surface-3)",
          boxShadow: "inset 0 0 0 0.5px var(--hairline)",
        }}
      >
        {(["signup", "signin"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setMode(item);
              setError(null);
              setMessage(null);
            }}
            className="pressable py-2 font-semibold"
            style={{
              borderRadius: "calc(var(--radius-lg) - 3px)",
              background: mode === item ? "var(--surface)" : "transparent",
              color: mode === item ? "var(--foreground)" : "var(--text-secondary)",
              boxShadow: mode === item ? "var(--shadow-sm)" : "none",
              letterSpacing: "-0.008em",
            }}
          >
            {item === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>
              Display name
            </span>
            <input
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex"
              className="w-full px-3.5 py-2.5 text-sm outline-none"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "none",
                boxShadow: "inset 0 0 0 0.5px var(--border-strong)",
                background: "var(--surface)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow =
                  "inset 0 0 0 1px var(--accent), 0 0 0 3px var(--accent-muted)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "inset 0 0 0 0.5px var(--border-strong)";
              }}
            />
          </label>
        )}

        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold" style={{ color: "var(--foreground)" }}>
            Email
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3.5 py-2.5 text-sm outline-none"
            style={{
              borderRadius: "var(--radius-lg)",
              border: "none",
              boxShadow: "inset 0 0 0 0.5px var(--border-strong)",
              background: "var(--surface)",
              color: "var(--foreground)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow =
                "inset 0 0 0 1px var(--accent), 0 0 0 3px var(--accent-muted)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "inset 0 0 0 0.5px var(--border-strong)";
            }}
          />
        </label>

        <div className="space-y-1.5 text-sm">
          <label htmlFor="auth-password" className="block font-semibold" style={{ color: "var(--foreground)" }}>
            Password
          </label>
          <div className="relative">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "8+ chars, A-Z, 0-9, symbol" : "••••••••"}
              className="w-full py-2.5 pl-3.5 pr-10 text-sm outline-none"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "none",
                boxShadow: "inset 0 0 0 0.5px var(--border-strong)",
                background: "var(--surface)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow =
                  "inset 0 0 0 1px var(--accent), 0 0 0 3px var(--accent-muted)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "inset 0 0 0 0.5px var(--border-strong)";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer p-1"
              style={{ color: "var(--text-muted)" }}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Requirements checklist - only shown in signup mode once user starts typing */}
          {mode === "signup" && password.length > 0 && (
            <ul
              className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1"
              aria-label="Password requirements"
            >
              {([
                { key: "length",    label: "8+ characters" },
                { key: "uppercase", label: "Uppercase letter" },
                { key: "number",    label: "Number" },
                { key: "symbol",    label: "Symbol (!@#…)" },
              ] as const).map(({ key, label }) => {
                const met = pwRules[key];
                return (
                  <li key={key} className="flex items-center gap-1.5 text-xs font-medium">
                    {met ? (
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M2.5 8l3.5 3.5 7-7" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                        <path d="M4 4l8 8M12 4l-8 8" />
                      </svg>
                    )}
                    <span style={{ color: met ? "#10b981" : "var(--text-muted)" }}>
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
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
          disabled={loading || (mode === "signup" && !pwAllValid)}
          className="pressable w-full px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            borderRadius: "var(--radius-lg)",
            background: "var(--accent)",
            boxShadow: "0 2px 12px var(--accent-muted), var(--shadow-sm)",
            letterSpacing: "-0.01em",
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
