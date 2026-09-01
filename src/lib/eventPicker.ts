import { startOfDay } from "@/lib/calendar";
import type { CalendarEvent } from "@/lib/events";
import { formatEventTime } from "@/lib/events";

export type EventPickerFilters = {
  titleQuery: string;
  onOrAfterDate: string | null;
};

export type EventPickerGroup = {
  dateKey: string;
  label: string;
  events: CalendarEvent[];
};

function localDateKey(iso: string): string {
  const date = new Date(iso);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function sortEventsForPicker(
  events: Pick<CalendarEvent, "title" | "starts_at">[],
): CalendarEvent[] {
  return [...(events as CalendarEvent[])].sort((a, b) => {
    const byStart = new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    if (byStart !== 0) return byStart;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

export function filterEventsForPicker(
  events: CalendarEvent[],
  filters: EventPickerFilters,
): CalendarEvent[] {
  const query = filters.titleQuery.trim().toLowerCase();
  const onOrAfterMs = filters.onOrAfterDate
    ? startOfDay(new Date(`${filters.onOrAfterDate}T12:00:00`)).getTime()
    : null;

  return events.filter((event) => {
    if (onOrAfterMs !== null && new Date(event.starts_at).getTime() < onOrAfterMs) {
      return false;
    }
    if (!query) return true;
    const haystack = `${event.title} ${event.description ?? ""}`.toLowerCase();
    return haystack.includes(query);
  });
}

export function formatPickerDateLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  const now = new Date();
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}

export function formatEventPickerTimeRange(event: Pick<CalendarEvent, "starts_at" | "ends_at">): string {
  const start = formatEventTime(event.starts_at);
  const end = formatEventTime(event.ends_at);
  const sameDay = localDateKey(event.starts_at) === localDateKey(event.ends_at);
  if (sameDay) return `${start} – ${end}`;
  return `${start} – ${formatPickerDateLabel(localDateKey(event.ends_at))} ${end}`;
}

export function formatLinkedEventLabel(event: Pick<CalendarEvent, "title" | "starts_at">): string {
  return `${event.title} · ${formatPickerDateLabel(localDateKey(event.starts_at))}`;
}

export function groupEventsForPicker(events: CalendarEvent[]): EventPickerGroup[] {
  const sorted = sortEventsForPicker(events);
  const groups = new Map<string, CalendarEvent[]>();

  for (const event of sorted) {
    const dateKey = localDateKey(event.starts_at);
    const bucket = groups.get(dateKey);
    if (bucket) bucket.push(event);
    else groups.set(dateKey, [event]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, groupEvents]) => ({
      dateKey,
      label: formatPickerDateLabel(dateKey),
      events: groupEvents,
    }));
}

export function filterAndGroupEventsForPicker(
  events: CalendarEvent[],
  filters: EventPickerFilters,
): EventPickerGroup[] {
  return groupEventsForPicker(filterEventsForPicker(events, filters));
}
