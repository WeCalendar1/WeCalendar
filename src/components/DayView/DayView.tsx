import { TimeGrid, dayAsCalendarDay } from "@/components/TimeGrid";
import type { CalendarEvent } from "@/lib/events";

type DayViewProps = {
  viewDate: Date;
  events: CalendarEvent[];
};

export function DayView({ viewDate, events }: DayViewProps) {
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
      <TimeGrid days={[dayAsCalendarDay(viewDate)]} events={events} />
    </div>
  );
}
