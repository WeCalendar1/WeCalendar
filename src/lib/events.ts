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

export function getSeriesSpanPosition(
  event: CalendarEvent,
  allEvents: CalendarEvent[],
  day: Date,
  dayOfWeek: number,
): SpanPosition {
  if (isMultiDayEvent(event)) return getSpanPosition(event, day, dayOfWeek);

  if (!event.recurrence_group_id) return "solo";

  const prevDay = startOfDay(new Date(day.getTime() - 86400000));
  const nextDay = startOfDay(new Date(day.getTime() + 86400000));

  const hasPrev = allEvents.some(
    (e) =>
      e.recurrence_group_id === event.recurrence_group_id &&
      isSameDay(new Date(e.starts_at), prevDay)
  );
  const hasNext = allEvents.some(
    (e) =>
      e.recurrence_group_id === event.recurrence_group_id &&
      isSameDay(new Date(e.starts_at), nextDay)
  );

  const isRowStart = dayOfWeek === 0; // Sunday
  const isRowEnd = dayOfWeek === 6;   // Saturday

  const isVisualStart = !hasPrev || isRowStart;
  const isVisualEnd = !hasNext || isRowEnd;

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

export type EventLayout = {
  event: CalendarEvent;
  column: number;      // 0-based column index within the overlap group
  totalColumns: number; // total columns needed for the overlap group
};

/**
 * Assigns each event a column slot so that overlapping events are shown
 * side-by-side (Google Calendar style).
 *
 * Algorithm:
 *  1. Sort events by start time.
 *  2. Greedily assign each event the first column not occupied by an event
 *     that overlaps it.
 *  3. Make a second pass to widen events whose rightmost column in their
 *     overlap cluster is unoccupied (so they expand to fill free space).
 */
export function layoutOverlappingEvents(events: CalendarEvent[]): EventLayout[] {
  if (events.length === 0) return [];

  // Sort by start time, then by end time descending (longer events first)
  const sorted = [...events].sort((a, b) => {
    const startDiff =
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    if (startDiff !== 0) return startDiff;
    // Longer events get lower columns
    return new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime();
  });

  /** Returns end-time in minutes-since-midnight (clamped to min 30min duration) */
  function endMin(e: CalendarEvent): number {
    const s = new Date(e.starts_at);
    const en = new Date(e.ends_at);
    const startM = s.getHours() * 60 + s.getMinutes();
    const endM = en.getHours() * 60 + en.getMinutes();
    return Math.max(endM, startM + 30);
  }

  function startMin(e: CalendarEvent): number {
    const s = new Date(e.starts_at);
    return s.getHours() * 60 + s.getMinutes();
  }

  function overlaps(a: CalendarEvent, b: CalendarEvent): boolean {
    return startMin(a) < endMin(b) && startMin(b) < endMin(a);
  }

  // Assign columns greedily
  const columns: number[] = new Array(sorted.length).fill(-1);
  // Track the end time of events placed in each column
  const colEnds: number[] = [];

  for (let i = 0; i < sorted.length; i++) {
    // Find overlapping events that already have a column assigned
    const usedCols = new Set<number>();
    for (let j = 0; j < i; j++) {
      if (overlaps(sorted[i], sorted[j])) {
        usedCols.add(columns[j]);
      }
    }
    // Pick the lowest free column
    let col = 0;
    while (usedCols.has(col)) col++;
    columns[i] = col;
    colEnds[col] = endMin(sorted[i]);
  }

  // Compute total columns per overlap cluster
  // Two events are in the same cluster if they directly or transitively overlap
  const clusterOf: number[] = new Array(sorted.length).fill(-1);
  let clusterCount = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (clusterOf[i] !== -1) continue;
    // BFS
    const queue = [i];
    clusterOf[i] = clusterCount;
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (let j = 0; j < sorted.length; j++) {
        if (clusterOf[j] === -1 && overlaps(sorted[cur], sorted[j])) {
          clusterOf[j] = clusterCount;
          queue.push(j);
        }
      }
    }
    clusterCount++;
  }

  // Max column per cluster → totalColumns for that cluster
  const clusterMaxCol: number[] = new Array(clusterCount).fill(0);
  for (let i = 0; i < sorted.length; i++) {
    clusterMaxCol[clusterOf[i]] = Math.max(
      clusterMaxCol[clusterOf[i]],
      columns[i],
    );
  }

  return sorted.map((event, i) => ({
    event,
    column: columns[i],
    totalColumns: clusterMaxCol[clusterOf[i]] + 1,
  }));
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
