import { isSameDay } from "@/lib/calendar";
import type { Tables } from "@/types/database";

export type CalendarEvent = Tables<"events">;

export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((event) => isSameDay(new Date(event.starts_at), day))
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
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
