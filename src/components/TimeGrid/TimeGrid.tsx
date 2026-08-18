"use client";

import {
  DAY_HOURS,
  formatHourLabel,
  getMinutesSinceMidnight,
  isSameDay,
  type CalendarDay,
} from "@/lib/calendar";
import {
  eventPosition,
  eventsForDay,
  formatEventTime,
  type CalendarEvent,
} from "@/lib/events";
import { colorForEvent, type EventTag, type Tag } from "@/lib/tags";

export const HOUR_HEIGHT_PX = 52;

type TimeGridProps = {
  days: CalendarDay[];
  events: CalendarEvent[];
  tags: Tag[];
  eventTags: EventTag[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onDayDoubleClick?: (date: Date) => void;
};

export function TimeGrid({ days, events, tags, eventTags, onSelectEvent, onDayDoubleClick }: TimeGridProps) {
  const now = new Date();
  const showNowLine = days.some((d) => d.isToday);
  const nowTop = (getMinutesSinceMidnight(now) / 60) * HOUR_HEIGHT_PX;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="grid shrink-0"
        style={{
          gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))`,
          borderBottom: "1.5px solid var(--border)",
          background: "var(--surface-2)",
        }}
      >
        <div />
        {days.map((day) => {
          const weekday = day.date.toLocaleDateString("en-US", { weekday: "short" });
          return (
            <div
              key={day.date.toISOString()}
              className="flex flex-col items-center gap-1 px-1 py-2"
            >
              <span
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: day.isToday ? "var(--accent)" : "var(--text-muted)" }}
              >
                {weekday}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center text-sm font-bold ${
                  day.isToday ? "today-badge text-white" : ""
                }`}
                style={{
                  borderRadius: "var(--radius-full)",
                  background: day.isToday ? "var(--accent)" : "transparent",
                  color: day.isToday ? "#fff" : "var(--foreground)",
                }}
              >
                {day.date.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="relative" style={{ minHeight: DAY_HOURS.length * HOUR_HEIGHT_PX }}>
          {DAY_HOURS.map((hour) => (
            <div
              key={hour}
              className="grid"
              style={{
                gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))`,
                height: HOUR_HEIGHT_PX,
              }}
            >
              <div
                className="pr-2 text-right text-[11px] font-medium"
                style={{
                  color: "var(--text-muted)",
                  transform: "translateY(-0.45em)",
                }}
              >
                {hour === 0 ? "" : formatHourLabel(hour)}
              </div>
              {days.map((day) => (
                <div
                  key={`${day.date.toISOString()}-${hour}`}
                  style={{
                    borderTop: "1px solid var(--border)",
                    borderLeft: "1px solid var(--border)",
                    background: day.isToday
                      ? "color-mix(in srgb, var(--accent-muted) 55%, var(--surface))"
                      : "var(--surface)",
                    cursor: "default",
                  }}
                  onDoubleClick={(e) => {
                    if (!onDayDoubleClick) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const fraction = (e.clientY - rect.top) / rect.height;
                    const minute = fraction < 0.5 ? 0 : 30;
                    const d = new Date(day.date);
                    d.setHours(hour, minute, 0, 0);
                    onDayDoubleClick(d);
                  }}
                />
              ))}
            </div>
          ))}

          {/* Event overlays per day column */}
          <div
            className="pointer-events-none absolute top-0 right-0 bottom-0"
            style={{ left: "4rem" }}
          >
            <div
              className="grid h-full"
              style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
            >
              {days.map((day) => (
                <div key={day.date.toISOString()} className="relative">
                  {eventsForDay(events, day.date).map((event) => {
                    const { top, height } = eventPosition(event, HOUR_HEIGHT_PX);
                    const color = colorForEvent(event.id, eventTags, tags) ?? "var(--accent)";
                    return (
                      <button
                        key={event.id}
                        type="button"
                        className="pointer-events-auto absolute right-1 left-1 overflow-hidden px-1.5 py-1 text-left text-[11px] font-semibold text-white"
                        title={`${event.title} · ${formatEventTime(event.starts_at)}`}
                        onClick={() => onSelectEvent?.(event)}
                        style={{
                          top,
                          height,
                          borderRadius: "var(--radius-sm)",
                          background: color,
                          boxShadow: "var(--shadow-sm)",
                        }}
                      >
                        <div className="truncate">{event.title}</div>
                        <div className="truncate opacity-90">
                          {formatEventTime(event.starts_at)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {showNowLine && (
            <div
              className="pointer-events-none absolute right-0 z-10"
              style={{ top: nowTop, left: "4rem" }}
              aria-hidden
            >
              <span
                className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
                style={{ background: "var(--color-danger)" }}
              />
              <div className="h-0.5 w-full" style={{ background: "var(--color-danger)" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function dayAsCalendarDay(date: Date, today = new Date()): CalendarDay {
  return {
    date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    inCurrentMonth: true,
    isToday: isSameDay(date, today),
  };
}
