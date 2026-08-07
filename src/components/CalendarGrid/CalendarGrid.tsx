import { CalendarCell } from "@/components/CalendarCell";
import { getMonthGrid } from "@/lib/calendar";
import type { CalendarEvent } from "@/lib/events";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarGridProps = {
  viewDate: Date;
  activeTagIds: string[];
  events: CalendarEvent[];
};

export function CalendarGrid({ viewDate, events }: CalendarGridProps) {
  const days = getMonthGrid(viewDate);

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1.5px solid var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div
        className="grid grid-cols-7"
        style={{ borderBottom: "1.5px solid var(--border)", background: "var(--surface-2)" }}
      >
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            <span className="sm:hidden">{day.slice(0, 1)}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 overflow-auto">
        {days.map((day) => (
          <CalendarCell key={day.date.toISOString()} day={day} events={events} />
        ))}
      </div>
    </div>
  );
}
