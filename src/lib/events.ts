import { isSameDay, startOfDay } from "@/lib/calendar";
import type { Tables } from "@/types/database";

export type CalendarEvent = Tables<"events">;

/** Single-day events that start on `day`, sorted by start time. */
export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((event) => isSameDay(new Date(event.starts_at), day))
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
}

/** True if an event spans more than one calendar day. */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  return !isSameDay(new Date(event.starts_at), new Date(event.ends_at));
}

/**
 * All events whose span includes `day` (starts_at day ≤ day ≤ ends_at day).
 * Sorted by start time. Use this for multi-day bar rendering in the month grid.
 */
export function eventsSpanningDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const d = startOfDay(day);
  return events
    .filter((event) => {
      const s = startOfDay(new Date(event.starts_at));
      const e = startOfDay(new Date(event.ends_at));
      return s <= d && d <= e;
    })
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
}

/**
 * Visual position of a multi-day event bar within a month-grid cell.
 * Week-row boundaries are respected: Sunday always starts a new visual bar
 * (even if the event started earlier) and Saturday always ends the bar.
 */
export type SpanPosition = "solo" | "start" | "middle" | "end";

export function getSpanPosition(
  event: CalendarEvent,
  day: Date,
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number,
): SpanPosition {
  const d = startOfDay(day);
  const s = startOfDay(new Date(event.starts_at));
  const en = startOfDay(new Date(event.ends_at));

  const isEventStart = s.getTime() === d.getTime();
  const isEventEnd = en.getTime() === d.getTime();
  const isRowStart = dayOfWeek === 0; // Sunday
  const isRowEnd = dayOfWeek === 6;   // Saturday

  const isVisualStart = isEventStart || isRowStart;
  const isVisualEnd = isEventEnd || isRowEnd;

  if (isVisualStart && isVisualEnd) return "solo";
  if (isVisualStart) return "start";
  if (isVisualEnd) return "end";
  return "middle";
}

export function eventPosition(
  event: CalendarEvent,
  hourHeightPx: number,
): { top: number; height: number } {
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = Math.max(
    end.getHours() * 60 + end.getMinutes(),
    startMinutes + 30,
  );
  const duration = endMinutes - startMinutes;

  return {
    top: (startMinutes / 60) * hourHeightPx,
    height: Math.max((duration / 60) * hourHeightPx, hourHeightPx * 0.5),
  };
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
