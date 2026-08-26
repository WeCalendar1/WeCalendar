import type { CalendarEvent } from "@/lib/events";

/** True when Postgres/PostgREST rejected a write for overlapping event times. */
export function isSchedulingConflictError(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  if (error.code === "23P01") return true;
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("events_no_overlapping_time") ||
    message.includes("exclusion constraint") ||
    message.includes("conflicting key value")
  );
}

export const SCHEDULING_CONFLICT_MESSAGE =
  "Scheduling conflict: that time overlaps an existing shared event. The first booking keeps the slot - pick a different time.";

/**
 * Half-open ranges [start, end) so back-to-back events
 * (10:00–11:00 and 11:00–12:00) are not treated as overlaps.
 */
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** IDs of events that overlap at least one other event in the list. */
export function conflictingEventIds(
  events: Pick<CalendarEvent, "id" | "starts_at" | "ends_at">[],
): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < events.length; i++) {
    const a = events[i]!;
    const aStart = new Date(a.starts_at).getTime();
    const aEnd = new Date(a.ends_at).getTime();
    for (let j = i + 1; j < events.length; j++) {
      const b = events[j]!;
      const bStart = new Date(b.starts_at).getTime();
      const bEnd = new Date(b.ends_at).getTime();
      if (rangesOverlap(aStart, aEnd, bStart, bEnd)) {
        ids.add(a.id);
        ids.add(b.id);
      }
    }
  }
  return ids;
}

/** True if [startsAt, endsAt) overlaps any event except those in `excludeIds`. */
export function draftOverlapsExisting(
  startsAt: Date,
  endsAt: Date,
  events: Pick<CalendarEvent, "id" | "title" | "starts_at" | "ends_at">[],
  excludeIds: Iterable<string> = [],
): { overlaps: boolean; titles: string[] } {
  const excluded = new Set(excludeIds);
  const start = startsAt.getTime();
  const end = endsAt.getTime();
  const titles: string[] = [];

  for (const event of events) {
    if (excluded.has(event.id)) continue;
    const eStart = new Date(event.starts_at).getTime();
    const eEnd = new Date(event.ends_at).getTime();
    if (rangesOverlap(start, end, eStart, eEnd)) {
      titles.push(event.title);
    }
  }

  return { overlaps: titles.length > 0, titles };
}

export function conflictFingerprint(ids: Iterable<string>): string {
  return [...ids].sort().join(",");
}
