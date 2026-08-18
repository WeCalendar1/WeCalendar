import { TimeGrid, dayAsCalendarDay } from "@/components/TimeGrid";
import type { CalendarEvent } from "@/lib/events";

type DayViewProps = {
  viewDate: Date;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onDayDoubleClick?: (date: Date) => void;
};

export function DayView({ viewDate, events, onSelectEvent, onDayDoubleClick }: DayViewProps) {
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
      <TimeGrid
        days={[dayAsCalendarDay(viewDate)]}
        events={events}
        onSelectEvent={onSelectEvent}
        onDayDoubleClick={onDayDoubleClick}
      />
    </div>
  );
}
