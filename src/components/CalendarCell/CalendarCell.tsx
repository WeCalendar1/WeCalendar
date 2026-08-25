import type { CalendarDay } from "@/lib/calendar";
import {
  eventsForDay,
  eventsSpanningDay,
  formatEventTime,
  getSpanPosition,
  getSeriesSpanPosition,
  isMultiDayEvent,
  type CalendarEvent,
  type SpanPosition,
} from "@/lib/events";
import { colorForEvent, type EventTag, type Tag } from "@/lib/tags";

// ─── Layout constants ─────────────────────────────────────────────────────────
/** Top padding of the cell (matches `p-2` = 8px). */
const CELL_PAD = 8;
/** Height of the day-number row (matches `h-7` = 28px). */
const DAY_NUM_H = 28;
/** Where multi-day bars start from the top of the cell box. */
const BARS_TOP = CELL_PAD + DAY_NUM_H; // 36 px
/** Height of each multi-day bar. */
const BAR_H = 17;
/** Gap between consecutive bar rows. */
const BAR_GAP = 2;
/** Total height consumed per slot. */
const BAR_ROW = BAR_H + BAR_GAP; // 19 px
/** Max bar rows before overflow collapses into "+N more". */
const MAX_SLOTS = 2;
/** Corner radius for bar caps. */
const BAR_RADIUS = 4;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Border-radius string for each position. */
function barRadius(pos: SpanPosition): string {
  switch (pos) {
    case "solo":   return `${BAR_RADIUS}px`;
    case "start":  return `${BAR_RADIUS}px 0 0 ${BAR_RADIUS}px`;
    case "end":    return `0 ${BAR_RADIUS}px ${BAR_RADIUS}px 0`;
    case "middle": return "0";
  }
}

/**
 * left / right values for absolutely-positioned bars.
 * "start" and "middle" bleed 1 px beyond the right cell edge (covering the
 * 1 px border between cells) so adjacent bars appear seamlessly connected.
 * "end" and "middle" do the same on the left.
 */
function barEdges(pos: SpanPosition): { left: number; right: number } {
  switch (pos) {
    case "solo":   return { left: CELL_PAD, right: CELL_PAD };
    case "start":  return { left: CELL_PAD, right: -1 };
    case "end":    return { left: -1,       right: CELL_PAD };
    case "middle": return { left: -1,       right: -1 };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

type CalendarCellProps = {
  day: CalendarDay;
  events: CalendarEvent[];
  tags: Tag[];
  eventTags: EventTag[];
  /** Slot index (0, 1, …) per multi-day event id — computed by CalendarGrid. */
  multiDaySlots: Map<string, number>;
  onSelectEvent?: (event: CalendarEvent) => void;
  onDoubleClick?: (date: Date) => void;
};

export function CalendarCell({
  day,
  events,
  tags,
  eventTags,
  multiDaySlots,
  onSelectEvent,
  onDoubleClick,
}: CalendarCellProps) {
  const dayOfWeek = day.date.getDay(); // 0 = Sun … 6 = Sat

  // ── Multi-day & Connected Series events ──────────────────────────────────────
  // Get true multi-day events
  const trueMultiDay = eventsSpanningDay(events, day.date).filter(isMultiDayEvent);
  
  // Get single-day events that are part of a series and connect visually on this day
  const cellSingleDayEvents = eventsForDay(events, day.date).filter((e) => !isMultiDayEvent(e));
  
  const connectedSeriesEvents = cellSingleDayEvents.filter((e) => {
    const pos = getSeriesSpanPosition(e, events, day.date, dayOfWeek);
    return pos !== "solo";
  });

  const multiDay = [...trueMultiDay, ...connectedSeriesEvents].sort(
    (a, b) => (multiDaySlots.get(a.id) ?? 0) - (multiDaySlots.get(b.id) ?? 0)
  );

  const visibleBars = multiDay.filter((e) => (multiDaySlots.get(e.id) ?? 0) < MAX_SLOTS);
  const hiddenBars  = multiDay.filter((e) => (multiDaySlots.get(e.id) ?? 0) >= MAX_SLOTS);

  /** How many bar rows are actually used in this cell (0–MAX_SLOTS). */
  const usedSlots =
    visibleBars.length > 0
      ? Math.max(...visibleBars.map((e) => multiDaySlots.get(e.id) ?? 0)) + 1
      : 0;

  // ── Solo Single-day events ──────────────────────────────────────────────────
  const singleDay = cellSingleDayEvents.filter((e) => {
    const pos = getSeriesSpanPosition(e, events, day.date, dayOfWeek);
    return pos === "solo";
  });
  
  const visibleSingle = singleDay.slice(0, 3);
  const extraSingle   = Math.max(singleDay.length - 3, 0);
  const totalExtra    = extraSingle + hiddenBars.length;

  return (
    <div
      className="group min-h-24 p-2 sm:min-h-28"
      style={{
        borderBottom: "1px solid var(--border)",
        borderRight:  "1px solid var(--border)",
        background: day.isToday
          ? "var(--accent-muted)"
          : day.inCurrentMonth
            ? "var(--surface)"
            : "var(--surface-2)",
        transition: "background var(--transition-fast)",
        cursor: "pointer",
        position: "relative",
        /* overflow must stay visible so multi-day bars can bleed 1 px into
           adjacent cell borders for a seamless connected appearance. */
        overflow: "visible",
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
      {/* Today accent bar */}
      {day.isToday && (
        <div
          className="absolute left-0 right-0 top-0 h-0.5"
          style={{ background: "var(--accent)" }}
        />
      )}

      {/* Day number */}
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
          {day.date.getDate()}
        </span>
      </div>

      {/* ── Multi-day bars (absolutely positioned) ─────────────────────────── */}
      {visibleBars.map((event) => {
        const slot  = multiDaySlots.get(event.id) ?? 0;
        const pos   = getSeriesSpanPosition(event, events, day.date, dayOfWeek);
        const color = colorForEvent(event.id, eventTags, tags) ?? "var(--accent)";
        const { left, right } = barEdges(pos);
        const showLabel = pos === "solo" || pos === "start";

        return (
          <button
            key={event.id}
            type="button"
            title={`${event.title} · ${formatEventTime(event.starts_at)} – ${formatEventTime(event.ends_at)}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectEvent?.(event);
            }}
            className="absolute flex cursor-pointer items-center overflow-hidden"
            style={{
              top:          BARS_TOP + slot * BAR_ROW,
              left,
              right,
              height:       BAR_H,
              background:   color,
              color:        "#fff",
              borderRadius: barRadius(pos),
              padding:      "0 5px",
              fontSize:     "10px",
              fontWeight:   600,
              lineHeight:   1,
              zIndex:       1,
              whiteSpace:   "nowrap",
            }}
          >
            {showLabel && (
              <span style={{ overflow: "hidden", flexShrink: 1, minWidth: 0 }}>
                {`${formatEventTime(event.starts_at)} `}
                {event.title}
              </span>
            )}
          </button>
        );
      })}

      {/* ── Spacer + single-day chips ───────────────────────────────────────── */}
      {/* The spacer reserves the vertical space that multi-day bars occupy
          (they are absolute, so they don't affect normal flow). */}
      <div style={{ height: usedSlots * BAR_ROW }} />

      <div className="space-y-1">
        {visibleSingle.map((event) => {
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
                background:   color,
                color:        "#fff",
              }}
            >
              {formatEventTime(event.starts_at)} {event.title}
            </button>
          );
        })}

        {totalExtra > 0 && (
          <p className="px-1 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
            +{totalExtra} more
          </p>
        )}
      </div>
    </div>
  );
}
