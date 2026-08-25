import { describe, it, expect } from "vitest";
import { eventsForDay, eventPosition, formatEventTime, isMultiDayEvent, eventsSpanningDay, getSpanPosition } from "./events";
import type { CalendarEvent } from "./events";

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: "evt-1",
    group_id: "grp-1",
    title: "Test Event",
    description: null,
    starts_at: "2025-06-15T09:00:00Z",
    ends_at: "2025-06-15T10:00:00Z",
    created_by: "user-1",
    has_conflict: false,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

const JUN_15_9AM = "2025-06-15T09:00:00.000Z";
const JUN_15_10AM = "2025-06-15T10:00:00.000Z";
const JUN_16_9AM = "2025-06-16T09:00:00.000Z";
const JUN_16_10AM = "2025-06-16T10:00:00.000Z";

// ── eventsForDay ──────────────────────────────────────────────────────────────

describe("eventsForDay", () => {
  const events: CalendarEvent[] = [
    makeEvent({ id: "e1", starts_at: JUN_15_9AM,  ends_at: JUN_15_10AM }),
    makeEvent({ id: "e2", starts_at: JUN_15_10AM, ends_at: JUN_15_9AM }),   // same day
    makeEvent({ id: "e3", starts_at: JUN_16_9AM,  ends_at: JUN_16_10AM }), // different day
  ];

  it("returns only events on the given day (local date match)", () => {
    // Parse the ISO string and compute the local date for Jun 15
    const jun15 = new Date(JUN_15_9AM);
    const targetDay = new Date(jun15.getFullYear(), jun15.getMonth(), jun15.getDate());
    const result = eventsForDay(events, targetDay);
    expect(result.map((e) => e.id)).toEqual(expect.arrayContaining(["e1", "e2"]));
    expect(result.find((e) => e.id === "e3")).toBeUndefined();
  });

  it("returns events sorted by start time ascending", () => {
    // Create two events on the same day, later one first in array
    const laterFirst: CalendarEvent[] = [
      makeEvent({ id: "late", starts_at: JUN_15_10AM, ends_at: JUN_15_10AM }),
      makeEvent({ id: "early", starts_at: JUN_15_9AM,  ends_at: JUN_15_10AM }),
    ];
    const jun15 = new Date(JUN_15_9AM);
    const targetDay = new Date(jun15.getFullYear(), jun15.getMonth(), jun15.getDate());
    const result = eventsForDay(laterFirst, targetDay);
    expect(result[0]!.id).toBe("early");
    expect(result[1]!.id).toBe("late");
  });

  it("returns empty array when no events on the day", () => {
    const jun20 = new Date(2025, 5, 20);
    expect(eventsForDay(events, jun20)).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    const jun15 = new Date(JUN_15_9AM);
    const targetDay = new Date(jun15.getFullYear(), jun15.getMonth(), jun15.getDate());
    expect(eventsForDay([], targetDay)).toHaveLength(0);
  });
});

// ── eventPosition ─────────────────────────────────────────────────────────────

describe("eventPosition", () => {
  const HOUR_PX = 60;

  it("places a 9 AM event at the correct top offset", () => {
    const event = makeEvent({ starts_at: "2025-06-15T09:00:00Z", ends_at: "2025-06-15T10:00:00Z" });
    const { top } = eventPosition(event, HOUR_PX);
    // 9 hours from midnight in local time → convert ISO to local
    const start = new Date(event.starts_at);
    const expectedTop = (start.getHours() * 60 + start.getMinutes()) / 60 * HOUR_PX;
    expect(top).toBe(expectedTop);
  });

  it("gives a 1-hour event a height equal to HOUR_PX", () => {
    const event = makeEvent({ starts_at: "2025-06-15T09:00:00Z", ends_at: "2025-06-15T10:00:00Z" });
    const { height } = eventPosition(event, HOUR_PX);
    expect(height).toBe(HOUR_PX);
  });

  it("enforces minimum height of 30 min for very short events", () => {
    // 5-minute event
    const event = makeEvent({
      starts_at: "2025-06-15T09:00:00Z",
      ends_at:   "2025-06-15T09:05:00Z",
    });
    const { height } = eventPosition(event, HOUR_PX);
    expect(height).toBe(HOUR_PX * 0.5); // minimum = 30 min
  });

  it("handles a 2-hour event", () => {
    const event = makeEvent({
      starts_at: "2025-06-15T08:00:00Z",
      ends_at:   "2025-06-15T10:00:00Z",
    });
    const { height } = eventPosition(event, HOUR_PX);
    expect(height).toBe(HOUR_PX * 2);
  });
});

// ── formatEventTime ───────────────────────────────────────────────────────────

describe("formatEventTime", () => {
  it("returns a non-empty string", () => {
    const result = formatEventTime("2025-06-15T09:00:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes AM or PM", () => {
    const result = formatEventTime("2025-06-15T09:00:00Z");
    expect(result).toMatch(/AM|PM/i);
  });
});

// ── isMultiDayEvent ───────────────────────────────────────────────────────────

describe("isMultiDayEvent", () => {
  it("returns false for a same-day event", () => {
    const event = makeEvent({ starts_at: "2025-06-15T09:00:00Z", ends_at: "2025-06-15T17:00:00Z" });
    expect(isMultiDayEvent(event)).toBe(false);
  });

  it("returns true for an event spanning two days", () => {
    const event = makeEvent({ starts_at: "2025-06-15T22:00:00.000Z", ends_at: "2025-06-16T06:00:00.000Z" });
    // Note: UTC dates differ; result depends on local timezone offset but the
    // helper compares local calendar days via isSameDay.
    // Use explicit local-midnight times to make the test deterministic.
    const localStart = new Date(2025, 5, 15, 22, 0, 0).toISOString();
    const localEnd   = new Date(2025, 5, 16,  6, 0, 0).toISOString();
    const evt = makeEvent({ starts_at: localStart, ends_at: localEnd });
    expect(isMultiDayEvent(evt)).toBe(true);
  });

  it("returns false for a midnight-to-midnight same-day event", () => {
    const evt = makeEvent({
      starts_at: new Date(2025, 5, 15, 0, 0, 0).toISOString(),
      ends_at:   new Date(2025, 5, 15, 23, 59, 0).toISOString(),
    });
    expect(isMultiDayEvent(evt)).toBe(false);
  });
});

// ── eventsSpanningDay ─────────────────────────────────────────────────────────

describe("eventsSpanningDay", () => {
  // Use local midnight timestamps to avoid timezone ambiguity
  const jun13 = new Date(2025, 5, 13);
  const jun14 = new Date(2025, 5, 14);
  const jun15 = new Date(2025, 5, 15);
  const jun17 = new Date(2025, 5, 17);
  const jun18 = new Date(2025, 5, 18);

  const singleDay = makeEvent({
    id: "single",
    starts_at: new Date(2025, 5, 15, 9, 0).toISOString(),
    ends_at:   new Date(2025, 5, 15, 10, 0).toISOString(),
  });
  const multiDay = makeEvent({
    id: "multi",
    starts_at: new Date(2025, 5, 14, 8, 0).toISOString(),
    ends_at:   new Date(2025, 5, 17, 18, 0).toISOString(),
  });
  const unrelated = makeEvent({
    id: "unrelated",
    starts_at: new Date(2025, 5, 20, 9, 0).toISOString(),
    ends_at:   new Date(2025, 5, 20, 10, 0).toISOString(),
  });

  const events = [singleDay, multiDay, unrelated];

  it("includes single-day events that start and end on the day", () => {
    expect(eventsSpanningDay(events, jun15).map((e) => e.id)).toContain("single");
  });

  it("includes multi-day events that span the given day", () => {
    // Jun 15 is in the middle of multi (Jun 14 – Jun 17)
    expect(eventsSpanningDay(events, jun15).map((e) => e.id)).toContain("multi");
  });

  it("includes multi-day event on its start day", () => {
    expect(eventsSpanningDay(events, jun14).map((e) => e.id)).toContain("multi");
  });

  it("includes multi-day event on its end day", () => {
    expect(eventsSpanningDay(events, jun17).map((e) => e.id)).toContain("multi");
  });

  it("excludes multi-day event the day before it starts", () => {
    expect(eventsSpanningDay(events, jun13).map((e) => e.id)).not.toContain("multi");
  });

  it("excludes multi-day event the day after it ends", () => {
    expect(eventsSpanningDay(events, jun18).map((e) => e.id)).not.toContain("multi");
  });

  it("excludes unrelated events", () => {
    expect(eventsSpanningDay(events, jun15).map((e) => e.id)).not.toContain("unrelated");
  });
});

// ── getSpanPosition ───────────────────────────────────────────────────────────

describe("getSpanPosition", () => {
  const event = makeEvent({
    starts_at: new Date(2025, 5, 16, 9, 0).toISOString(), // Monday Jun 16
    ends_at:   new Date(2025, 5, 19, 17, 0).toISOString(), // Thursday Jun 19
  });

  const mon = new Date(2025, 5, 16); // dayOfWeek 1
  const tue = new Date(2025, 5, 17); // dayOfWeek 2
  const thu = new Date(2025, 5, 19); // dayOfWeek 4

  it("returns 'start' on the first day (non-Sunday)", () => {
    expect(getSpanPosition(event, mon, mon.getDay())).toBe("start");
  });

  it("returns 'middle' on an intermediate day", () => {
    expect(getSpanPosition(event, tue, tue.getDay())).toBe("middle");
  });

  it("returns 'end' on the last day (non-Saturday)", () => {
    expect(getSpanPosition(event, thu, thu.getDay())).toBe("end");
  });

  it("returns 'solo' for a single-day event", () => {
    const solo = makeEvent({
      starts_at: new Date(2025, 5, 15, 9, 0).toISOString(),
      ends_at:   new Date(2025, 5, 15, 17, 0).toISOString(),
    });
    const sun15 = new Date(2025, 5, 15); // Sunday
    expect(getSpanPosition(solo, sun15, sun15.getDay())).toBe("solo");
  });

  it("caps to 'end' on Saturday regardless of actual event end", () => {
    // Event runs Mon–Thu, but we're testing a hypothetical Saturday in the middle
    const satEvent = makeEvent({
      starts_at: new Date(2025, 5, 14, 9, 0).toISOString(), // Sat Jun 14
      ends_at:   new Date(2025, 5, 21, 17, 0).toISOString(), // Sat Jun 21
    });
    const sat14 = new Date(2025, 5, 14);
    expect(getSpanPosition(satEvent, sat14, 6)).toBe("solo"); // start-and-end-of-row
  });

  it("caps to 'start' on Sunday if event started before this week", () => {
    // Reuse event (Mon 16 – Thu 19); test Sunday June 15 which is BEFORE start
    // …that day isn't spanned, but test a genuine spanning Sunday
    const longEvent = makeEvent({
      starts_at: new Date(2025, 5, 14, 9, 0).toISOString(), // Sat Jun 14
      ends_at:   new Date(2025, 5, 21, 17, 0).toISOString(), // Sat Jun 21
    });
    const sun15 = new Date(2025, 5, 15); // Sunday Jun 15 — in the middle
    expect(getSpanPosition(longEvent, sun15, 0)).toBe("start");
  });
});

