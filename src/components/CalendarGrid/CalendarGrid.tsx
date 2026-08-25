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

function computeMultiDaySlots(events: CalendarEvent[]): Map<string, number> {
  const seriesGroups = new Map<string, CalendarEvent[]>();
  const isolatedMultiDay: CalendarEvent[] = [];

  for (const event of events) {
    if (event.recurrence_group_id) {
      const group = seriesGroups.get(event.recurrence_group_id) || [];
      group.push(event);
      seriesGroups.set(event.recurrence_group_id, group);
    } else if (isMultiDayEvent(event)) {
      isolatedMultiDay.push(event);
    }
  }

  type Span = {
    eventIds: string[];
    start: Date;
    end: Date;
  };

  const spans: Span[] = [];

  for (const group of seriesGroups.values()) {
    if (group.length === 1 && !isMultiDayEvent(group[0]!)) continue;
    
    let minS = new Date(group[0]!.starts_at);
    let maxE = new Date(group[0]!.ends_at);
    for (const e of group) {
      const s = new Date(e.starts_at);
      const en = new Date(e.ends_at);
      if (s < minS) minS = s;
      if (en > maxE) maxE = en;
    }
    spans.push({
      eventIds: group.map((e) => e.id),
      start: startOfDay(minS),
      end: startOfDay(maxE),
    });
  }

  for (const event of isolatedMultiDay) {
    spans.push({
      eventIds: [event.id],
      start: startOfDay(new Date(event.starts_at)),
      end: startOfDay(new Date(event.ends_at)),
    });
  }

  spans.sort((a, b) => {
    const diff = a.start.getTime() - b.start.getTime();
    if (diff !== 0) return diff;
    return b.end.getTime() - a.end.getTime();
  });

  const slots = new Map<string, number>();
  const spanSlots = new Map<Span, number>();

  for (const span of spans) {
    let slot = 0;
    while (true) {
      const conflict = spans.some((other) => {
        if (other === span) return false;
        if (spanSlots.get(other) !== slot) return false;
        return span.start <= other.end && span.end >= other.start;
      });
      if (!conflict) break;
      slot++;
    }
    spanSlots.set(span, slot);
    for (const id of span.eventIds) {
      slots.set(id, slot);
    }
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
