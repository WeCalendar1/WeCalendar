import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            WeCalendar
          </Link>
          <p className="text-sm text-stone-600">
            Sign in to your shared workspace.
          </p>
        </div>

        <div className="space-y-3 rounded-lg bg-accent-muted/60 p-4 text-sm text-stone-700">
          <p className="font-medium text-foreground">Auth coming next</p>
          <p>
            Wire up Supabase by copying{" "}
            <code className="rounded bg-white px-1 py-0.5 text-xs">
              .env.example
            </code>{" "}
            to{" "}
            <code className="rounded bg-white px-1 py-0.5 text-xs">
              .env.local
            </code>{" "}
            and adding your project URL and anon key.
          </p>
        </div>

        <Link
          href="/"
          className="block text-center text-sm text-accent hover:underline"
        >
          ← Back home
        </Link>
      </div>
    </div>
  );
}
