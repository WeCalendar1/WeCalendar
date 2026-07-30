import { CalendarGrid } from "@/components/CalendarGrid";
import type { CalendarMode } from "@/lib/calendar";

type CalendarProps = {
  viewDate: Date;
  calendarMode: CalendarMode;
};

export function Calendar({ viewDate, calendarMode }: CalendarProps) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col p-3 sm:p-4">
      {calendarMode === "month" ? (
        <CalendarGrid viewDate={viewDate} />
      ) : (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-surface text-sm text-stone-500 shadow-sm">
          {calendarMode.charAt(0).toUpperCase() + calendarMode.slice(1)} view
          coming soon
        </div>
      )}
    </section>
  );
}
