import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/Auth";

export default function LoginPage() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-6 py-16"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-sm space-y-6 p-8"
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1.5px solid var(--border)",
          background: "var(--surface)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="space-y-2 text-center">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight"
            style={{
              fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
              color: "var(--foreground)",
            }}
          >
            WeCalendar
          </Link>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Create an account or sign in to your shared workspace.
          </p>
        </div>

        <Suspense fallback={<p className="text-center text-sm">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
