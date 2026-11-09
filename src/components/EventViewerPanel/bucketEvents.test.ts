import { describe, expect, it } from "vitest";
import { bucketEvents } from "./EventViewerPanel";
import type { CalendarEvent } from "@/lib/events";

function ev(id: string, startsAt: Date): CalendarEvent {
  return {
    id,
    group_id: "g1",
    title: id,
    description: null,
    starts_at: startsAt.toISOString(),
    ends_at: new Date(startsAt.getTime() + 3600_000).toISOString(),
    created_by: "u1",
    has_conflict: false,
    recurrence_group_id: null,
    place_id: null,
    sync_id: null,
    external_uid: null,
    created_at: startsAt.toISOString(),
    updated_at: startsAt.toISOString(),
  };
}

describe("bucketEvents weekStartsOnMonday", () => {
  it("keeps upcoming Sunday in 'thisWeek' when weekStartsOnMonday is true (vs 'nextWeek' when false)", () => {
    const wedNow = new Date(2026, 10, 4, 10, 0); // Wed Nov 4, 2026
    const sunEvent = ev("sun", new Date(2026, 10, 8, 12, 0)); // Sun Nov 8, 2026

    const sunStart = bucketEvents([sunEvent], wedNow, false);
    expect(sunStart.nextWeek.map((e) => e.id)).toEqual(["sun"]);

    const monStart = bucketEvents([sunEvent], wedNow, true);
    expect(monStart.thisWeek.map((e) => e.id)).toEqual(["sun"]);
  });
});

