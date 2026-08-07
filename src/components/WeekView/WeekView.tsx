import { TimeGrid } from "@/components/TimeGrid";
import { getWeekDays } from "@/lib/calendar";
import type { CalendarEvent } from "@/lib/events";

type WeekViewProps = {
  viewDate: Date;
  events: CalendarEvent[];
};

export function WeekView({ viewDate, events }: WeekViewProps) {
  const days = getWeekDays(viewDate);

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
      <TimeGrid days={days} events={events} />
    </div>
  );
}
