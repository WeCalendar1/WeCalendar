import { addDays, isSameDay, startOfDay } from "@/lib/calendar";
import type { Tables } from "@/types/database";

export type CalendarEvent = Tables<"events"> & {
  creator?: Pick<Tables<"profiles">, "display_name" | "avatar_url" | "theme_preferences"> | null;
};

/** Single-day events that start on `day`, sorted by start time. */
export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((event) => isSameDay(new Date(event.starts_at), day))
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
}

/**
 * Events that occupy time on `day` in Day/Week TimeGrid views.
 * Includes multi-day events spanning `day`, while excluding events that end
 * at exact 00:00 midnight at the start of `day`.
 */
export function eventsForTimeGridDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = startOfDay(addDays(day, 1)).getTime();

  return events
    .filter((event) => {
      const s = new Date(event.starts_at);
      const e = new Date(event.ends_at);
      const st = s.getTime();
      const et = e.getTime();
      if (et <= st) return isSameDay(s, day);
      return st < dayEnd && et > dayStart;
    })
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
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
 * Week-row boundaries are respected: row start (Sunday or Monday) always starts
 * a new visual bar and row end (Saturday or Sunday) always ends the bar.
 */
export type SpanPosition = "solo" | "start" | "middle" | "end";

export function getSpanPosition(
  event: CalendarEvent,
  day: Date,
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number,
  weekStartsOnMonday = false,
): SpanPosition {
  const d = startOfDay(day);
  const s = startOfDay(new Date(event.starts_at));
  const en = startOfDay(new Date(event.ends_at));

  const isEventStart = s.getTime() === d.getTime();
  const isEventEnd = en.getTime() === d.getTime();
  const isRowStart = dayOfWeek === (weekStartsOnMonday ? 1 : 0);
  const isRowEnd = dayOfWeek === (weekStartsOnMonday ? 0 : 6);

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
  weekStartsOnMonday = false,
): SpanPosition {
  if (isMultiDayEvent(event)) {
    return getSpanPosition(event, day, dayOfWeek, weekStartsOnMonday);
  }

  if (!event.recurrence_group_id) return "solo";

  const prevDay = startOfDay(addDays(day, -1));
  const nextDay = startOfDay(addDays(day, 1));

  const hasPrev = allEvents.some(
    (e) =>
      e.recurrence_group_id === event.recurrence_group_id &&
      isSameDay(new Date(e.starts_at), prevDay),
  );
  const hasNext = allEvents.some(
    (e) =>
      e.recurrence_group_id === event.recurrence_group_id &&
      isSameDay(new Date(e.starts_at), nextDay),
  );

  const isRowStart = dayOfWeek === (weekStartsOnMonday ? 1 : 0);
  const isRowEnd = dayOfWeek === (weekStartsOnMonday ? 0 : 6);

  const isVisualStart = !hasPrev || isRowStart;
  const isVisualEnd = !hasNext || isRowEnd;

  if (isVisualStart && isVisualEnd) return "solo";
  if (isVisualStart) return "start";
  if (isVisualEnd) return "end";
  return "middle";
}

function daySegmentMinutes(
  event: CalendarEvent,
  day?: Date,
): { startMinutes: number; endMinutes: number } {
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);

  if (!day) {
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = Math.max(
      end.getHours() * 60 + end.getMinutes(),
      startMinutes + 30,
    );
    return { startMinutes, endMinutes };
  }

  const dayStart = startOfDay(day);
  const dayEnd = startOfDay(addDays(dayStart, 1));

  const startMinutes =
    start.getTime() <= dayStart.getTime()
      ? 0
      : start.getHours() * 60 + start.getMinutes();

  const rawEndMinutes =
    end.getTime() >= dayEnd.getTime()
      ? 1440
      : end.getHours() * 60 + end.getMinutes();

  const endMinutes =
    startMinutes <= 1410
      ? Math.min(1440, Math.max(rawEndMinutes, startMinutes + 30))
      : Math.max(rawEndMinutes, startMinutes + 30);

  return { startMinutes, endMinutes };
}

export function eventPosition(
  event: CalendarEvent,
  hourHeightPx: number,
  day?: Date,
): { top: number; height: number } {
  const { startMinutes, endMinutes } = daySegmentMinutes(event, day);
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
export function layoutOverlappingEvents(
  events: CalendarEvent[],
  day?: Date,
): EventLayout[] {
  if (events.length === 0) return [];

  // Sort by segment start time, then by segment end time descending (longer events first)
  const sorted = [...events].sort((a, b) => {
    const segA = daySegmentMinutes(a, day);
    const segB = daySegmentMinutes(b, day);
    if (segA.startMinutes !== segB.startMinutes) {
      return segA.startMinutes - segB.startMinutes;
    }
    return segB.endMinutes - segA.endMinutes;
  });

  function overlaps(a: CalendarEvent, b: CalendarEvent): boolean {
    const segA = daySegmentMinutes(a, day);
    const segB = daySegmentMinutes(b, day);
    return segA.startMinutes < segB.endMinutes && segB.startMinutes < segA.endMinutes;
  }

  // Assign columns greedily
  const columns: number[] = new Array(sorted.length).fill(-1);
  // Track the end time of events placed in each column
  const colEnds: number[] = [];

  for (let i = 0; i < sorted.length; i++) {
    // Find overlapping events that already have a column assigned
    const usedCols = new Set<number>();
    for (let j = 0; j < i; j++) {
      if (overlaps(sorted[i]!, sorted[j]!)) {
        usedCols.add(columns[j]!);
      }
    }
    // Pick the lowest free column
    let col = 0;
    while (usedCols.has(col)) col++;
    columns[i] = col;
    colEnds[col] = daySegmentMinutes(sorted[i]!, day).endMinutes;
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
        if (clusterOf[j] === -1 && overlaps(sorted[cur]!, sorted[j]!)) {
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
    clusterMaxCol[clusterOf[i]!] = Math.max(
      clusterMaxCol[clusterOf[i]!]!,
      columns[i]!,
    );
  }

  return sorted.map((event, i) => ({
    event,
    column: columns[i]!,
    totalColumns: clusterMaxCol[clusterOf[i]!]! + 1,
  }));
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
