import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "./events";
import {
  filterAndGroupEventsForPicker,
  filterEventsForPicker,
  formatLinkedEventLabel,
  groupEventsForPicker,
  sortEventsForPicker,
} from "./eventPicker";

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "e1",
    group_id: "g1",
    title: "Meeting",
    description: null,
    starts_at: "2026-08-15T14:00:00.000Z",
    ends_at: "2026-08-15T15:00:00.000Z",
    created_by: "u1",
    has_conflict: false,
    recurrence_group_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("sortEventsForPicker", () => {
  it("sorts by start time then title", () => {
    const events = [
      makeEvent({ id: "b", title: "Bravo", starts_at: "2026-08-15T10:00:00.000Z" }),
      makeEvent({ id: "a", title: "Alpha", starts_at: "2026-08-15T10:00:00.000Z" }),
      makeEvent({ id: "c", title: "Earlier", starts_at: "2026-08-14T10:00:00.000Z" }),
    ];
    expect(sortEventsForPicker(events).map((e) => e.id)).toEqual(["c", "a", "b"]);
  });
});

describe("filterEventsForPicker", () => {
  it("filters by title and on-or-after date", () => {
    const events = [
      makeEvent({ id: "old", title: "Overlap", starts_at: "2026-08-10T10:00:00.000Z" }),
      makeEvent({ id: "new", title: "Overlap long test", starts_at: "2026-08-20T10:00:00.000Z" }),
      makeEvent({ id: "other", title: "Larping", starts_at: "2026-08-21T10:00:00.000Z" }),
    ];

    expect(
      filterEventsForPicker(events, { titleQuery: "overlap", onOrAfterDate: "2026-08-15" }).map(
        (e) => e.id,
      ),
    ).toEqual(["new"]);
  });
});

describe("groupEventsForPicker", () => {
  it("groups by local date in date-then-title order", () => {
    const groups = groupEventsForPicker([
      makeEvent({ id: "d2", title: "B", starts_at: "2026-08-16T10:00:00.000Z" }),
      makeEvent({ id: "d1a", title: "A", starts_at: "2026-08-15T09:00:00.000Z" }),
      makeEvent({ id: "d1b", title: "C", starts_at: "2026-08-15T12:00:00.000Z" }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]!.events.map((e) => e.id)).toEqual(["d1a", "d1b"]);
    expect(groups[1]!.events.map((e) => e.id)).toEqual(["d2"]);
  });
});

describe("formatLinkedEventLabel", () => {
  it("includes title and date", () => {
    const label = formatLinkedEventLabel(
      makeEvent({ title: "Scrap-booking", starts_at: "2026-08-15T14:00:00.000Z" }),
    );
    expect(label).toContain("Scrap-booking");
    expect(label).toContain("·");
  });
});

describe("filterAndGroupEventsForPicker", () => {
  it("combines filter and group", () => {
    const result = filterAndGroupEventsForPicker(
      [
        makeEvent({ id: "1", title: "Overlap", starts_at: "2026-08-10T10:00:00.000Z" }),
        makeEvent({ id: "2", title: "Overlap 2", starts_at: "2026-08-20T10:00:00.000Z" }),
      ],
      { titleQuery: "overlap", onOrAfterDate: "2026-08-15" },
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.events.map((e) => e.id)).toEqual(["2"]);
  });
});
