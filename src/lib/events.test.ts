import { describe, it, expect } from "vitest";
import {
  buildDraftInterval,
  effectiveEventEndDay,
  eventsForDay,
  eventsForTimeGridDay,
  eventPosition,
  expandEventDateKeys,
  formatEventTime,
  groupConsecutiveDateKeys,
  isMultiDayEvent,
  eventsSpanningDay,
  getSpanPosition,
  getSeriesSpanPosition,
  layoutOverlappingEvents,
  prepareBulkEventInserts,
  reconcileSeriesUpdate,
  validateDraftDateGroups,
} from "./events";
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
    recurrence_group_id: null,
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
    const sun15 = new Date(2025, 5, 15); // Sunday Jun 15 - in the middle
    expect(getSpanPosition(longEvent, sun15, 0)).toBe("start");
  });
});



describe("Monday row-wrapping & TimeGrid multi-day clipping", () => {
  it("wraps multi-day and series spans at Sunday->Monday when weekStartsOnMonday is true", () => {
    // Fri Nov 6 18:00 -> Tue Nov 10 11:00, 2026
    const trip = makeEvent({
      id: "trip",
      recurrence_group_id: "rg-1",
      starts_at: new Date(2026, 10, 6, 18, 0).toISOString(),
      ends_at: new Date(2026, 10, 10, 11, 0).toISOString(),
    });

    // Saturday Nov 7 (dayOfWeek = 6): middle when Monday-first, end when Sunday-first
    expect(getSpanPosition(trip, new Date(2026, 10, 7), 6, false)).toBe("end");
    expect(getSpanPosition(trip, new Date(2026, 10, 7), 6, true)).toBe("middle");
    // Sunday Nov 8 (dayOfWeek = 0): start when Sunday-first, end when Monday-first
    expect(getSeriesSpanPosition(trip, [trip], new Date(2026, 10, 8), 0, true)).toBe("end");
    // Monday Nov 9 (dayOfWeek = 1): middle when Sunday-first, start when Monday-first
    expect(getSeriesSpanPosition(trip, [trip], new Date(2026, 10, 9), 1, true)).toBe("start");
  });

  it("clips multi-day events with endTime <= startTime across Fri/Sat/Sun in TimeGrid", () => {
    const retreat = makeEvent({
      id: "retreat",
      starts_at: new Date(2026, 10, 6, 18, 0).toISOString(), // Fri 6 PM
      ends_at: new Date(2026, 10, 8, 11, 0).toISOString(),   // Sun 11 AM
    });
    const sundayBrunch = makeEvent({
      id: "brunch",
      starts_at: new Date(2026, 10, 8, 10, 0).toISOString(), // Sun 10 AM
      ends_at: new Date(2026, 10, 8, 12, 0).toISOString(),   // Sun 12 PM
    });

    expect(eventPosition(retreat, 60, new Date(2026, 10, 6))).toEqual({ top: 18 * 60, height: 6 * 60 });
    expect(eventPosition(retreat, 60, new Date(2026, 10, 7))).toEqual({ top: 0, height: 24 * 60 });
    expect(eventPosition(retreat, 60, new Date(2026, 10, 8))).toEqual({ top: 0, height: 11 * 60 });

    const sundayLayout = layoutOverlappingEvents([retreat, sundayBrunch], new Date(2026, 10, 8));
    expect(sundayLayout.map((l) => l.totalColumns)).toEqual([2, 2]);
  });

  it("excludes trailing exact-midnight 00:00 endpoints from the next day's TimeGrid", () => {
    const lateShow = makeEvent({
      id: "late",
      starts_at: new Date(2026, 10, 6, 22, 0).toISOString(),
      ends_at: new Date(2026, 10, 7, 0, 0).toISOString(),
    });
    expect(eventsForTimeGridDay([lateShow], new Date(2026, 10, 6)).map((e) => e.id)).toEqual(["late"]);
    expect(eventsForTimeGridDay([lateShow], new Date(2026, 10, 7))).toEqual([]);
  });
});


describe("multi-day modal date helpers", () => {
  it("expands multi-day spans into YYYY-MM-DD keys while ignoring exact-midnight trailing day", () => {
    expect(
      expandEventDateKeys(
        new Date(2026, 10, 6, 18, 0).toISOString(),
        new Date(2026, 10, 8, 11, 0).toISOString(),
      ),
    ).toEqual(["2026-11-06", "2026-11-07", "2026-11-08"]);

    expect(
      expandEventDateKeys(
        new Date(2026, 10, 6, 22, 0).toISOString(),
        new Date(2026, 10, 7, 0, 0).toISOString(),
      ),
    ).toEqual(["2026-11-06"]);
  });

  it("allows endTime <= startTime on multi-day groups, rejects it on single-day groups, and blocks split ranges on single-event edits", () => {
    const multiDay = groupConsecutiveDateKeys(["2026-11-06", "2026-11-07", "2026-11-08"]);
    expect(validateDraftDateGroups(multiDay, "18:00", "11:00")).toBeNull();

    const singleDay = groupConsecutiveDateKeys(["2026-11-06"]);
    expect(validateDraftDateGroups(singleDay, "18:00", "11:00")).toBe(
      "End time must be after start time.",
    );

    const splitDays = groupConsecutiveDateKeys(["2026-11-06", "2026-11-08"]);
    expect(
      validateDraftDateGroups(splitDays, "09:00", "11:00", { isSingleEventEdit: true }),
    ).toBe("Select consecutive dates when editing a single event.");
  });

  it("round-trips exact-midnight 00:00 endpoints without validation failure or 24-hour truncation", () => {
    // 1-day event ending at midnight: Fri Nov 6 22:00 -> Sat Nov 7 00:00
    const singleKeys = expandEventDateKeys(
      new Date(2026, 10, 6, 22, 0).toISOString(),
      new Date(2026, 10, 7, 0, 0).toISOString(),
    );
    expect(singleKeys).toEqual(["2026-11-06"]);
    const singleGroups = groupConsecutiveDateKeys(singleKeys);
    expect(validateDraftDateGroups(singleGroups, "22:00", "00:00")).toBeNull();
    const singleInterval = buildDraftInterval(
      singleGroups[0]![0]!,
      singleGroups[0]![singleGroups[0]!.length - 1]!,
      "22:00",
      "00:00",
    );
    expect(singleInterval).toEqual({
      startsAt: new Date(2026, 10, 6, 22, 0, 0),
      endsAt: new Date(2026, 10, 7, 0, 0, 0),
    });

    // Multi-day event ending at midnight: Fri Nov 6 18:00 -> Sun Nov 8 00:00
    const multiKeys = expandEventDateKeys(
      new Date(2026, 10, 6, 18, 0).toISOString(),
      new Date(2026, 10, 8, 0, 0).toISOString(),
    );
    expect(multiKeys).toEqual(["2026-11-06", "2026-11-07"]);
    const multiGroups = groupConsecutiveDateKeys(multiKeys);
    expect(validateDraftDateGroups(multiGroups, "18:00", "00:00")).toBeNull();
    const multiInterval = buildDraftInterval(
      multiGroups[0]![0]!,
      multiGroups[0]![multiGroups[0]!.length - 1]!,
      "18:00",
      "00:00",
    );
    expect(multiInterval).toEqual({
      startsAt: new Date(2026, 10, 6, 18, 0, 0),
      endsAt: new Date(2026, 10, 8, 0, 0, 0),
    });
  });

  it("keeps Month-view spanning helpers consistent with TimeGrid on exact-midnight 00:00 endpoints", () => {
    const lateShow = makeEvent({
      id: "late",
      starts_at: new Date(2026, 10, 6, 22, 0).toISOString(), // Fri 22:00
      ends_at: new Date(2026, 10, 7, 0, 0).toISOString(),    // Sat 00:00
    });
    expect(effectiveEventEndDay(lateShow.starts_at, lateShow.ends_at)).toEqual(
      new Date(2026, 10, 6),
    );
    expect(isMultiDayEvent(lateShow)).toBe(false);
    expect(eventsSpanningDay([lateShow], new Date(2026, 10, 6)).map((e) => e.id)).toEqual(["late"]);
    expect(eventsSpanningDay([lateShow], new Date(2026, 10, 7))).toEqual([]);

    const twoDayMidnight = makeEvent({
      id: "two-day",
      starts_at: new Date(2026, 10, 6, 18, 0).toISOString(), // Fri 18:00
      ends_at: new Date(2026, 10, 8, 0, 0).toISOString(),    // Sun 00:00
    });
    expect(isMultiDayEvent(twoDayMidnight)).toBe(true);
    expect(eventsSpanningDay([twoDayMidnight], new Date(2026, 10, 7)).map((e) => e.id)).toEqual(["two-day"]);
    expect(eventsSpanningDay([twoDayMidnight], new Date(2026, 10, 8))).toEqual([]);
    expect(getSpanPosition(twoDayMidnight, new Date(2026, 10, 6), 5, true)).toBe("start");
    expect(getSpanPosition(twoDayMidnight, new Date(2026, 10, 7), 6, true)).toBe("end");
  });

  it("pre-assigns event IDs for bulk inserts so tag rows do not depend on RETURNING order", () => {
    let seq = 0;
    const makeId = () => `id-${++seq}`;
    const { eventRows, tagRows } = prepareBulkEventInserts(
      [
        {
          title: "First",
          description: "",
          startsAt: new Date("2026-11-06T09:00:00.000Z"),
          endsAt: new Date("2026-11-06T10:00:00.000Z"),
          tagIds: ["tag-a", "tag-b"],
        },
        {
          title: "Second",
          description: "Notes",
          startsAt: new Date("2026-11-07T09:00:00.000Z"),
          endsAt: new Date("2026-11-07T10:00:00.000Z"),
          tagIds: ["tag-c"],
        },
      ],
      { groupId: "grp-1", userId: "user-1", createId: makeId },
    );

    expect(eventRows.map((r) => ({ id: r.id, title: r.title, recurrence_group_id: r.recurrence_group_id }))).toEqual([
      { id: "id-2", title: "First", recurrence_group_id: "id-1" },
      { id: "id-3", title: "Second", recurrence_group_id: "id-1" },
    ]);
    expect(tagRows).toEqual([
      { event_id: "id-2", tag_id: "tag-a" },
      { event_id: "id-2", tag_id: "tag-b" },
      { event_id: "id-3", tag_id: "tag-c" },
    ]);
  });

  it("reconciles series updates in-place by date, consuming each existing ID at most once", () => {
    let seq = 0;
    const makeId = () => `new-${++seq}`;

    const existing = [
      { id: "e1", starts_at: new Date(2026, 10, 6, 9, 0).toISOString() },
      { id: "e2", starts_at: new Date(2026, 10, 13, 9, 0).toISOString() },
      { id: "e3", starts_at: new Date(2026, 10, 20, 9, 0).toISOString() },
    ];

    const result = reconcileSeriesUpdate(
      existing,
      [
        {
          title: "Standup AM",
          description: "Updated",
          startsAt: new Date(2026, 10, 6, 9, 0),
          endsAt: new Date(2026, 10, 6, 9, 30),
          tagIds: ["t1"],
        },
        {
          title: "Standup PM",
          description: "Extra same day",
          startsAt: new Date(2026, 10, 6, 16, 0),
          endsAt: new Date(2026, 10, 6, 16, 30),
          tagIds: ["t2"],
        },
        {
          title: "Standup Week 2",
          description: "",
          startsAt: new Date(2026, 10, 13, 9, 0),
          endsAt: new Date(2026, 10, 13, 9, 30),
          tagIds: [],
        },
        {
          title: "Standup Week 4",
          description: "Added",
          startsAt: new Date(2026, 10, 27, 9, 0),
          endsAt: new Date(2026, 10, 27, 9, 30),
          tagIds: ["t1", "t2"],
        },
      ],
      {
        groupId: "grp-1",
        userId: "u1",
        recurrenceGroupId: "rec-1",
        createId: makeId,
      },
    );

    expect(result.updates.map((u) => ({ id: u.id, title: u.patch.title, tagIds: u.tagIds }))).toEqual([
      { id: "e1", title: "Standup AM", tagIds: ["t1"] },
      { id: "e2", title: "Standup Week 2", tagIds: [] },
    ]);
    expect(result.deleteIds).toEqual(["e3"]);
    expect(result.insertEventRows.map((r) => ({ id: r.id, title: r.title, recurrence_group_id: r.recurrence_group_id }))).toEqual([
      { id: "new-1", title: "Standup PM", recurrence_group_id: "rec-1" },
      { id: "new-2", title: "Standup Week 4", recurrence_group_id: "rec-1" },
    ]);
    expect(result.insertTagRows).toEqual([
      { event_id: "new-1", tag_id: "t2" },
      { event_id: "new-2", tag_id: "t1" },
      { event_id: "new-2", tag_id: "t2" },
    ]);
  });
});
