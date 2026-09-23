"use client";
import { EventCreatorBadge } from "@/components/EventCreatorBadge";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CalendarEvent } from "@/lib/events";
import { formatEventTime } from "@/lib/events";
import { colorForEvent, tagIdsForEvent, type EventTag, type Tag } from "@/lib/tags";
import { startOfDay, startOfWeek, addDays } from "@/lib/calendar";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeBucket =
  | "today"
  | "tomorrow"
  | "thisWeek"
  | "nextWeek"
  | "later"
  | "past";

const BUCKET_META: Record<TimeBucket, { label: string; defaultOpen: boolean }> = {
  today:    { label: "Today",     defaultOpen: true  },
  tomorrow: { label: "Tomorrow",  defaultOpen: true  },
  thisWeek: { label: "This Week", defaultOpen: true  },
  nextWeek: { label: "Next Week", defaultOpen: true  },
  later:    { label: "Later",     defaultOpen: false },
  past:     { label: "Past",      defaultOpen: false },
};

const BUCKET_ORDER: TimeBucket[] = [
  "today",
  "tomorrow",
  "thisWeek",
  "nextWeek",
  "later",
  "past",
];

// ─── Bucketing ────────────────────────────────────────────────────────────────

function bucketEvents(
  events: CalendarEvent[],
): Record<TimeBucket, CalendarEvent[]> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const dayAfterTomorrow = addDays(todayStart, 2);

  // "This Week" = rest of the Sun-Sat week after tomorrow
  const weekStart = startOfWeek(todayStart);
  const nextWeekStart = addDays(weekStart, 7);
  const weekAfterNextStart = addDays(weekStart, 14);

  const buckets: Record<TimeBucket, CalendarEvent[]> = {
    today: [],
    tomorrow: [],
    thisWeek: [],
    nextWeek: [],
    later: [],
    past: [],
  };

  for (const event of events) {
    const eventStart = startOfDay(new Date(event.starts_at));
    const t = eventStart.getTime();

    if (t < todayStart.getTime()) {
      buckets.past.push(event);
    } else if (t < tomorrowStart.getTime()) {
      buckets.today.push(event);
    } else if (t < dayAfterTomorrow.getTime()) {
      buckets.tomorrow.push(event);
    } else if (t < nextWeekStart.getTime()) {
      buckets.thisWeek.push(event);
    } else if (t < weekAfterNextStart.getTime()) {
      buckets.nextWeek.push(event);
    } else {
      buckets.later.push(event);
    }
  }

  // Sort each bucket by start time
  for (const key of BUCKET_ORDER) {
    buckets[key].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  }
  // Past: most recent first
  buckets.past.reverse();

  return buckets;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BucketSection({
  bucket,
  events,
  tags,
  eventTags,
  showDate,
  onSelectEvent,
}: {
  bucket: TimeBucket;
  events: CalendarEvent[];
  tags: Tag[];
  eventTags: EventTag[];
  showDate: boolean;
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  const meta = BUCKET_META[bucket];
  const [open, setOpen] = useState(meta.defaultOpen);

  if (events.length === 0) return null;

  return (
    <div
      style={{
        borderRadius: "var(--radius-xl)",
        background: "var(--surface)",
        boxShadow: "inset 0 0 0 0.5px var(--hairline), var(--shadow-sm)",
      }}
    >
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="pressable flex w-full items-center justify-between px-3.5 py-2.5"
        style={{
          background: "transparent",
          borderRadius: open
            ? "var(--radius-xl) var(--radius-xl) 0 0"
            : "var(--radius-xl)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-label"
            style={{ color: "var(--foreground)", fontWeight: 600, letterSpacing: "-0.01em" }}
          >
            {meta.label}
          </span>
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
            style={{
              background: "var(--accent-muted)",
              color: "var(--accent)",
            }}
          >
            {events.length}
          </span>
        </div>
        <motion.svg
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ type: "spring", bounce: 0, duration: 0.25 }}
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 shrink-0"
          style={{ color: "var(--text-muted)" }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" />
        </motion.svg>
      </button>

      {/* Collapsible body */}
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        style={{ overflow: "hidden" }}
      >
        <div className="flex flex-col gap-0.5 px-1.5 pb-1.5">
          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              tags={tags}
              eventTags={eventTags}
              showDate={showDate}
              onSelect={() => onSelectEvent(event)}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function EventRow({
  event,
  tags,
  eventTags,
  showDate,
  onSelect,
}: {
  event: CalendarEvent;
  tags: Tag[];
  eventTags: EventTag[];
  showDate: boolean;
  onSelect: () => void;
}) {
  const tagIds = tagIdsForEvent(event.id, eventTags);
  const eventColor = colorForEvent(event.id, eventTags, tags);
  const matchingTags = tags.filter((t) => tagIds.includes(t.id));

  const startDate = new Date(event.starts_at);
  const dateLabel = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const isRecurring = Boolean(event.recurrence_group_id);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="pressable flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors"
      style={{ cursor: "pointer" }}
    >
      {/* Tag colour bar */}
      <div
        className="mt-1 h-8 w-1 shrink-0 rounded-full"
        style={{ background: eventColor ?? "var(--accent)" }}
      />

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span
            className="truncate text-sm font-semibold"
            style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
          >
            <EventCreatorBadge event={event} /> {event.title}
          </span>
          {isRecurring && (
            <svg
              viewBox="0 0 16 16"
              className="h-3 w-3 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--text-muted)" }}
              aria-label="Recurring"
            >
              <path d="M2 8a6 6 0 0 1 10.47-4M14 8a6 6 0 0 1-10.47 4" />
              <path d="M13 1v3h-3M3 15v-3h3" />
            </svg>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs" style={{ color: "var(--text-secondary)", letterSpacing: "-0.004em" }}>
          <span className="font-medium">
            {formatEventTime(event.starts_at)} – {formatEventTime(event.ends_at)}
          </span>
          {showDate && (
            <>
              <span style={{ color: "var(--separator)" }}>·</span>
              <span>{dateLabel}</span>
            </>
          )}
        </div>

        {/* Tag chips */}
        {matchingTags.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1">
            {matchingTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  background: `color-mix(in srgb, ${tag.color} 14%, transparent)`,
                  color: tag.color,
                  letterSpacing: "-0.004em",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: tag.color }}
                />
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Description snippet */}
        {event.description && (
          <p
            className="mt-0.5 truncate text-xs"
            style={{ color: "var(--text-muted)", letterSpacing: "-0.004em" }}
          >
            {event.description}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export type EventViewerPanelProps = {
  visible: boolean;
  events: CalendarEvent[];
  tags: Tag[];
  eventTags: EventTag[];
  searchQuery: string;
  todayJumpKey?: number;
  onSelectEvent: (event: CalendarEvent) => void;
};

export function EventViewerPanel({
  visible,
  events,
  tags,
  eventTags,
  todayJumpKey,
  onSelectEvent,
}: EventViewerPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (todayJumpKey && todayJumpKey > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [todayJumpKey]);

  const buckets = useMemo(() => bucketEvents(events), [events]);

  const hasAnyEvents = events.length > 0;

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.aside
          key="event-viewer"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.35 }}
          className="shrink-0 overflow-hidden"
          style={{
            borderLeft: "none",
            boxShadow: "inset 0.5px 0 0 var(--separator)",
          }}
        >
          <div
            ref={scrollRef}
            className="flex h-full w-[380px] flex-col overflow-y-auto"
            style={{ background: "var(--background)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
              >
                Events
              </h2>
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                style={{
                  background: "var(--accent-muted)",
                  color: "var(--accent)",
                }}
              >
                {events.length}
              </span>
            </div>

            {/* Body */}
            {hasAnyEvents ? (
              <div className="flex flex-col gap-2 px-3 pb-4">
                {BUCKET_ORDER.map((bucket) => (
                  <BucketSection
                    key={bucket}
                    bucket={bucket}
                    events={buckets[bucket]}
                    tags={tags}
                    eventTags={eventTags}
                    showDate={bucket !== "today" && bucket !== "tomorrow"}
                    onSelectEvent={onSelectEvent}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <svg
                  viewBox="0 0 48 48"
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--text-muted)", opacity: 0.5 }}
                >
                  <rect x="6" y="10" width="36" height="32" rx="6" />
                  <path d="M6 18h36M16 6v8M32 6v8" />
                  <circle cx="24" cy="30" r="4" />
                </svg>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-secondary)", letterSpacing: "-0.01em" }}
                  >
                    No events yet
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Create an event to see it listed here
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
