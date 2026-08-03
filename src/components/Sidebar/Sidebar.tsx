import { MiniCalendar } from "./MiniCalendar";

type SidebarProps = {
  open: boolean;
  viewDate: Date;
  onCreateEvent: () => void;
};

export function Sidebar({ open, viewDate, onCreateEvent }: SidebarProps) {
  return (
    <aside
      className={`shrink-0 overflow-hidden border-r border-border bg-surface transition-[width] duration-200 ease-out ${
        open ? "w-64" : "w-0 border-r-0"
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full w-64 flex-col gap-4 p-4">
        <button
          type="button"
          onClick={onCreateEvent}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <span className="text-lg leading-none">+</span>
          Create Event
        </button>

        <MiniCalendar viewDate={viewDate} />

        <div className="flex flex-1 flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Widgets
          </p>
          <div className="rounded-xl border border-dashed border-border bg-stone-50/80 p-4 text-sm text-stone-500">
            Space reserved for shared lists, reminders, and other modules.
          </div>
        </div>
      </div>
    </aside>
  );
}
