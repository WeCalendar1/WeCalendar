import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight">WeCalendar</span>
          <Link
            href="/login"
            className="rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div className="max-w-2xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-wider text-accent">
            Shared calendar & notes
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            One canvas for schedules, lists, and reminders.
          </h1>
          <p className="text-lg leading-relaxed text-stone-600">
            WeCalendar helps groups see events together, spot conflicts, and
            keep grocery lists, to-dos, and wishlists in sync — without digging
            through texts and screenshots.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Get started
          </Link>
        </div>

        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Shared calendar",
              body: "Aggregate events and see conflicts and open time at a glance.",
            },
            {
              title: "Live modules",
              body: "Collaborative lists that update instantly across the group.",
            },
            {
              title: "Invite & sync",
              body: "Link accounts with invite codes to create a shared workspace.",
            },
          ].map((item) => (
            <li
              key={item.title}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <h2 className="font-medium text-foreground">{item.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
