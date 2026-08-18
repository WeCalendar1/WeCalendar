import { TimeGrid } from "@/components/TimeGrid";
import { getWeekDays } from "@/lib/calendar";
import type { CalendarEvent } from "@/lib/events";

type WeekViewProps = {
  viewDate: Date;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onDayDoubleClick?: (date: Date) => void;
};

export function WeekView({ viewDate, events, onSelectEvent, onDayDoubleClick }: WeekViewProps) {
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
      <TimeGrid days={days} events={events} onSelectEvent={onSelectEvent} onDayDoubleClick={onDayDoubleClick} />
    </div>
  );
}
