import { describe, it, expect } from "vitest";
import { eventsForDay, eventPosition, formatEventTime } from "./events";
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
