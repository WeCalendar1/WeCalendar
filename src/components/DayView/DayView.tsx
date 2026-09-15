import { TimeGrid, dayAsCalendarDay } from "@/components/TimeGrid";
import type { CalendarEvent } from "@/lib/events";
import type { EventTag, Tag } from "@/lib/tags";

type DayViewProps = {
  viewDate: Date;
  events: CalendarEvent[];
  tags: Tag[];
  eventTags: EventTag[];
  conflictIds?: ReadonlySet<string>;
  showConflictHighlights?: boolean;
  onSelectEvent?: (event: CalendarEvent) => void;
  onDayDoubleClick?: (date: Date) => void;
  todayJumpKey?: number;
};

export function DayView({
  viewDate,
  events,
  tags,
  eventTags,
  conflictIds,
  showConflictHighlights,
  todayJumpKey,
  onSelectEvent,
  onDayDoubleClick,
}: DayViewProps) {
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
        tags={tags}
        eventTags={eventTags}
        conflictIds={conflictIds}
        showConflictHighlights={showConflictHighlights}
        todayJumpKey={todayJumpKey}
        onSelectEvent={onSelectEvent}
        onDayDoubleClick={onDayDoubleClick}
      />
    </div>
  );
}
