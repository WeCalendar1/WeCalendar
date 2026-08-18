import type { CalendarDay } from "@/lib/calendar";
import { eventsForDay, formatEventTime, type CalendarEvent } from "@/lib/events";
import { colorForEvent, type EventTag, type Tag } from "@/lib/tags";

type CalendarCellProps = {
  day: CalendarDay;
  events: CalendarEvent[];
  tags: Tag[];
  eventTags: EventTag[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onDoubleClick?: (date: Date) => void;
};

export function CalendarCell({ day, events, tags, eventTags, onSelectEvent, onDoubleClick }: CalendarCellProps) {
  const dayNumber = day.date.getDate();
  const dayEvents = eventsForDay(events, day.date).slice(0, 3);
  const extra = Math.max(eventsForDay(events, day.date).length - 3, 0);

  return (
    <div
      className="group min-h-24 p-2 sm:min-h-28"
      style={{
        borderBottom: "1px solid var(--border)",
        borderRight: "1px solid var(--border)",
        background: day.isToday
          ? "var(--accent-muted)"
          : day.inCurrentMonth
            ? "var(--surface)"
            : "var(--surface-2)",
        transition: "background var(--transition-fast)",
        cursor: "pointer",
        position: "relative",
      }}
      onDoubleClick={() => onDoubleClick?.(day.date)}
      onMouseEnter={(e) => {
        if (!day.isToday) {
          (e.currentTarget as HTMLElement).style.background = "var(--accent-muted)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = day.isToday
          ? "var(--accent-muted)"
          : day.inCurrentMonth
            ? "var(--surface)"
            : "var(--surface-2)";
      }}
    >
      {day.isToday && (
        <div
          className="absolute left-0 right-0 top-0 h-0.5"
          style={{ background: "var(--accent)" }}
        />
      )}

      <div className="flex justify-end">
        <span
          className={`flex h-7 w-7 items-center justify-center text-sm font-bold ${
            day.isToday ? "today-badge text-white" : ""
          }`}
          style={{
            borderRadius: "var(--radius-full)",
            background: day.isToday ? "var(--accent)" : "transparent",
            color: day.isToday
              ? "#fff"
              : day.inCurrentMonth
                ? "var(--foreground)"
                : "var(--text-muted)",
            fontSize: day.isToday ? "0.8125rem" : undefined,
            transition: "all var(--transition-fast)",
          }}
        >
          {dayNumber}
        </span>
      </div>

      <div className="mt-1 space-y-1">
        {dayEvents.map((event) => {
          const color = colorForEvent(event.id, eventTags, tags) ?? "var(--accent)";
          return (
            <button
              key={event.id}
              type="button"
              className="block w-full truncate px-1.5 py-0.5 text-left text-[10px] font-semibold leading-tight"
              title={`${event.title} · ${formatEventTime(event.starts_at)}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectEvent?.(event);
              }}
              style={{
                borderRadius: "var(--radius-sm)",
                background: color,
                color: "#fff",
              }}
            >
              {formatEventTime(event.starts_at)} {event.title}
            </button>
          );
        })}
        {extra > 0 && (
          <p className="px-1 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
            +{extra} more
          </p>
        )}
      </div>
    </div>
  );
}
