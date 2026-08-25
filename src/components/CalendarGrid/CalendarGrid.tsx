import { CalendarCell } from "@/components/CalendarCell";
import { getMonthGrid, startOfDay } from "@/lib/calendar";
import { isMultiDayEvent, type CalendarEvent } from "@/lib/events";
import type { EventTag, Tag } from "@/lib/tags";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarGridProps = {
  viewDate: Date;
  activeTagIds: string[];
  events: CalendarEvent[];
  tags: Tag[];
  eventTags: EventTag[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onDayDoubleClick?: (date: Date) => void;
};

/**
 * Greedily assigns a vertical slot (0, 1, …) to each multi-day event so that
 * overlapping date spans land on different bar rows within the month grid.
 * Longer / earlier-starting events claim lower-numbered slots first.
 */
function computeMultiDaySlots(events: CalendarEvent[]): Map<string, number> {
  const multiDay = events
    .filter(isMultiDayEvent)
    .sort((a, b) => {
      const diff =
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      if (diff !== 0) return diff;
      // Longer events win ties (earlier end = lower slot priority)
      return new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime();
    });

  const slots = new Map<string, number>();

  for (const event of multiDay) {
    const s = startOfDay(new Date(event.starts_at));
    const e = startOfDay(new Date(event.ends_at));

    let slot = 0;
    while (true) {
      const conflict = multiDay.some((other) => {
        if (other.id === event.id) return false;
        if (slots.get(other.id) !== slot) return false;
        const os = startOfDay(new Date(other.starts_at));
        const oe = startOfDay(new Date(other.ends_at));
        // Spans overlap when one starts before the other ends
        return s <= oe && e >= os;
      });
      if (!conflict) break;
      slot++;
    }

    slots.set(event.id, slot);
  }

  return slots;
}

export function CalendarGrid({
  viewDate,
  events,
  tags,
  eventTags,
  onSelectEvent,
  onDayDoubleClick,
}: CalendarGridProps) {
  const days = getMonthGrid(viewDate);
  const multiDaySlots = computeMultiDaySlots(events);

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
          <CalendarCell
            key={day.date.toISOString()}
            day={day}
            events={events}
            tags={tags}
            eventTags={eventTags}
            multiDaySlots={multiDaySlots}
            onSelectEvent={onSelectEvent}
            onDoubleClick={onDayDoubleClick}
          />
        ))}
      </div>
    </div>
  );
}
