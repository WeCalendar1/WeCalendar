import { addDays, isSameDay, startOfDay } from "@/lib/calendar";
import type { RsvpStatus } from "@/lib/rsvps";
import type { Tables } from "@/types/database";

export type CalendarEvent = Tables<"events"> & {
  creator?: Pick<Tables<"profiles">, "display_name" | "avatar_url" | "theme_preferences"> | null;
  myRsvp?: RsvpStatus | null;
};

/**
 * Returns the last local calendar day (`00:00`) occupied by `[startsAt, endsAt]`.
 * An event ending at exact `00:00:00.000` with `endsAt > startsAt` ends at the
 * boundary of the previous day rather than spilling onto the new day.
 */
export function effectiveEventEndDay(
  startsAt: Date | string,
  endsAt: Date | string,
): Date {
  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  const end = typeof endsAt === "string" ? new Date(endsAt) : endsAt;
  const startDay = startOfDay(start);
  const endDay = startOfDay(end);

  if (
    end.getTime() > start.getTime() &&
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    end.getMilliseconds() === 0 &&
    endDay.getTime() > startDay.getTime()
  ) {
    return startOfDay(addDays(endDay, -1));
  }

  return endDay.getTime() >= startDay.getTime() ? endDay : startDay;
}

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

/** True if an event occupies more than one calendar day. */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  return !isSameDay(
    new Date(event.starts_at),
    effectiveEventEndDay(event.starts_at, event.ends_at),
  );
}

/**
 * All events whose occupied day span includes `day`.
 * Sorted by start time. Use this for multi-day bar rendering in the month grid.
 */
export function eventsSpanningDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const d = startOfDay(day);
  return events
    .filter((event) => {
      const s = startOfDay(new Date(event.starts_at));
      const e = effectiveEventEndDay(event.starts_at, event.ends_at);
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
  const en = effectiveEventEndDay(event.starts_at, event.ends_at);

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


function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

/**
 * Expands an event's [starts_at .. ends_at] into local YYYY-MM-DD keys.
 * Excludes a trailing exact-midnight (00:00:00.000) end day when ends_at > starts_at.
 */
export function expandEventDateKeys(startsAtIso: string, endsAtIso: string): string[] {
  const firstDay = startOfDay(new Date(startsAtIso));
  const lastDay = effectiveEventEndDay(startsAtIso, endsAtIso);

  const keys: string[] = [];
  let cursor = firstDay;
  while (cursor.getTime() <= lastDay.getTime()) {
    keys.push(toLocalDateKey(cursor));
    cursor = startOfDay(addDays(cursor, 1));
  }
  return keys.length > 0 ? keys : [toLocalDateKey(firstDay)];
}

/** Groups sorted YYYY-MM-DD keys into contiguous calendar-day runs (DST-safe). */
export function groupConsecutiveDateKeys(dates: Iterable<string>): string[][] {
  const sorted = [...new Set(dates)].sort();
  if (sorted.length === 0) return [];

  const groups: string[][] = [[sorted[0]!]];
  for (let i = 1; i < sorted.length; i++) {
    const prevNextKey = toLocalDateKey(addDays(parseLocalDateKey(sorted[i - 1]!), 1));
    if (sorted[i] === prevNextKey) {
      groups[groups.length - 1]!.push(sorted[i]!);
    } else {
      groups.push([sorted[i]!]);
    }
  }
  return groups;
}

/**
 * Builds local `[startsAt, endsAt]` Date objects from a contiguous date range
 * and `"HH:MM"` time strings. Treats `endTime === "00:00"` as `24:00` (end-of-day
 * midnight on `endDateStr`, i.e. `00:00` of the following day), matching
 * `expandEventDateKeys`.
 */
export function buildDraftInterval(
  startDateStr: string,
  endDateStr: string,
  startTime: string,
  endTime: string,
  offsetDays = 0,
  offsetMonths = 0,
): { startsAt: Date; endsAt: Date } | null {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  const [sy, smo, sd] = startDateStr.split("-").map(Number);
  const startsAt = new Date(sy!, smo! - 1, sd!, sh ?? 0, sm ?? 0, 0);

  const [ey, emo, ed] = endDateStr.split("-").map(Number);
  const endsAt = new Date(ey!, emo! - 1, ed!, eh ?? 0, em ?? 0, 0);

  if (offsetMonths !== 0) {
    startsAt.setMonth(startsAt.getMonth() + offsetMonths);
    endsAt.setMonth(endsAt.getMonth() + offsetMonths);
  }
  if (offsetDays !== 0) {
    startsAt.setDate(startsAt.getDate() + offsetDays);
    endsAt.setDate(endsAt.getDate() + offsetDays);
  }
  if ((eh ?? 0) === 0 && (em ?? 0) === 0) {
    endsAt.setDate(endsAt.getDate() + 1);
  }

  if (endsAt <= startsAt) return null;
  return { startsAt, endsAt };
}

export function validateDraftDateGroups(
  groups: string[][],
  startTime: string,
  endTime: string,
  options?: { isSingleEventEdit?: boolean },
): string | null {
  if (groups.length === 0) {
    return "Please select at least one date.";
  }
  if (options?.isSingleEventEdit && groups.length > 1) {
    return "Select consecutive dates when editing a single event.";
  }

  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMinutes = (sh ?? 0) * 60 + (sm ?? 0);
  const endMinutes = (eh ?? 0) === 0 && (em ?? 0) === 0 ? 1440 : (eh ?? 0) * 60 + (em ?? 0);

  if (groups.some((g) => g.length === 1) && endMinutes <= startMinutes) {
    return "End time must be after start time.";
  }

  return null;
}

export function prepareBulkEventInserts(
  drafts: readonly {
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
    tagIds: readonly string[];
  }[],
  params: {
    groupId: string;
    userId: string;
    recurrenceGroupId?: string;
    createId?: () => string;
  },
): {
  eventRows: {
    id: string;
    group_id: string;
    title: string;
    description: string | null;
    starts_at: string;
    ends_at: string;
    created_by: string;
    recurrence_group_id: string | null;
  }[];
  tagRows: { event_id: string; tag_id: string }[];
} {
  const makeId = params.createId ?? (() => crypto.randomUUID());
  const sharedRecurrenceId =
    drafts.length > 1 ? (params.recurrenceGroupId ?? makeId()) : null;

  const eventRows: {
    id: string;
    group_id: string;
    title: string;
    description: string | null;
    starts_at: string;
    ends_at: string;
    created_by: string;
    recurrence_group_id: string | null;
  }[] = [];
  const tagRows: { event_id: string; tag_id: string }[] = [];

  for (const input of drafts) {
    const id = makeId();
    eventRows.push({
      id,
      group_id: params.groupId,
      title: input.title,
      description: input.description || null,
      starts_at: input.startsAt.toISOString(),
      ends_at: input.endsAt.toISOString(),
      created_by: params.userId,
      recurrence_group_id: sharedRecurrenceId,
    });
    for (const tagId of input.tagIds) {
      tagRows.push({ event_id: id, tag_id: tagId });
    }
  }

  return { eventRows, tagRows };
}

export function reconcileSeriesUpdate(
  existingEvents: readonly Pick<CalendarEvent, "id" | "starts_at">[],
  drafts: readonly {
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
    tagIds: readonly string[];
  }[],
  params: {
    groupId: string;
    userId: string;
    recurrenceGroupId: string;
    createId?: () => string;
  },
): {
  updates: {
    id: string;
    patch: {
      title: string;
      description: string | null;
      starts_at: string;
      ends_at: string;
      recurrence_group_id: string | null;
    };
    tagIds: string[];
  }[];
  deleteIds: string[];
  insertEventRows: ReturnType<typeof prepareBulkEventInserts>["eventRows"];
  insertTagRows: ReturnType<typeof prepareBulkEventInserts>["tagRows"];
} {
  const makeId = params.createId ?? (() => crypto.randomUUID());
  const sharedRecurrenceId = drafts.length > 1 ? params.recurrenceGroupId : null;

  const idsByDateKey = new Map<string, string[]>();
  for (const existing of existingEvents) {
    const key = toLocalDateKey(new Date(existing.starts_at));
    const bucket = idsByDateKey.get(key);
    if (bucket) bucket.push(existing.id);
    else idsByDateKey.set(key, [existing.id]);
  }

  const updates: {
    id: string;
    patch: {
      title: string;
      description: string | null;
      starts_at: string;
      ends_at: string;
      recurrence_group_id: string | null;
    };
    tagIds: string[];
  }[] = [];
  const insertEventRows: ReturnType<typeof prepareBulkEventInserts>["eventRows"] = [];
  const insertTagRows: ReturnType<typeof prepareBulkEventInserts>["tagRows"] = [];

  for (const draft of drafts) {
    const key = toLocalDateKey(draft.startsAt);
    const bucket = idsByDateKey.get(key);
    const matchedId = bucket && bucket.length > 0 ? bucket.shift() : undefined;

    if (matchedId) {
      updates.push({
        id: matchedId,
        patch: {
          title: draft.title,
          description: draft.description || null,
          starts_at: draft.startsAt.toISOString(),
          ends_at: draft.endsAt.toISOString(),
          recurrence_group_id: sharedRecurrenceId,
        },
        tagIds: [...draft.tagIds],
      });
    } else {
      const id = makeId();
      insertEventRows.push({
        id,
        group_id: params.groupId,
        title: draft.title,
        description: draft.description || null,
        starts_at: draft.startsAt.toISOString(),
        ends_at: draft.endsAt.toISOString(),
        created_by: params.userId,
        recurrence_group_id: sharedRecurrenceId,
      });
      for (const tagId of draft.tagIds) {
        insertTagRows.push({ event_id: id, tag_id: tagId });
      }
    }
  }

  const deleteIds: string[] = [];
  for (const bucket of idsByDateKey.values()) {
    for (const unusedId of bucket) {
      deleteIds.push(unusedId);
    }
  }

  return { updates, deleteIds, insertEventRows, insertTagRows };
}
