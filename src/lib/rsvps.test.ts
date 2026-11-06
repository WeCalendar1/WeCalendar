import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  filterConflictCandidateEvents,
  filterVisibleEvents,
  isRsvpStatus,
  rsvpMapForUser,
  summarizeEventRsvps,
  type EventRsvp,
} from "./rsvps";

function makeRsvp(overrides: Partial<EventRsvp> & { event_id: string; user_id: string }): EventRsvp {
  return {
    event_id: overrides.event_id,
    group_id: overrides.group_id ?? "g1",
    user_id: overrides.user_id,
    status: overrides.status ?? "going",
    updated_at: overrides.updated_at ?? "2026-11-05T12:00:00Z",
  };
}

describe("rsvps helpers", () => {
  it("validates RsvpStatus values and maps RSVPs for the active user while ignoring invalid statuses", () => {
    expect(isRsvpStatus("going")).toBe(true);
    expect(isRsvpStatus("maybe")).toBe(true);
    expect(isRsvpStatus("declined")).toBe(true);
    expect(isRsvpStatus("tentative")).toBe(false);

    const rows: EventRsvp[] = [
      makeRsvp({ event_id: "e1", user_id: "u1", status: "going" }),
      makeRsvp({ event_id: "e2", user_id: "u1", status: "declined" }),
      makeRsvp({ event_id: "e2", user_id: "u2", status: "going" }),
      makeRsvp({ event_id: "e3", user_id: "u1", status: "invalid" as never }),
    ];

    expect(rsvpMapForUser(rows, null).size).toBe(0);
    const map = rsvpMapForUser(rows, "u1");
    expect(map.get("e1")).toBe("going");
    expect(map.get("e2")).toBe("declined");
    expect(map.has("e3")).toBe(false);
  });

  it("summarizes event RSVPs with You first, status ordering, alphabetical tie-breaking, and Member fallback", () => {
    const profiles = new Map<string, { display_name: string | null; avatar_url?: string | null }>([
      ["u-zoe", { display_name: "Zoe", avatar_url: "https://example.com/zoe.png" }],
      ["u-amy", { display_name: "Amy", avatar_url: null }],
      ["u-blank", { display_name: "   ", avatar_url: null }],
      ["u-me", { display_name: "Alex", avatar_url: "https://example.com/me.png" }],
    ]);

    const rows: EventRsvp[] = [
      makeRsvp({ event_id: "e1", user_id: "u-zoe", status: "going" }),
      makeRsvp({ event_id: "e1", user_id: "u-amy", status: "going" }),
      makeRsvp({ event_id: "e1", user_id: "u-blank", status: "maybe" }),
      makeRsvp({ event_id: "e1", user_id: "u-missing", status: "declined" }),
      makeRsvp({ event_id: "e1", user_id: "u-me", status: "declined" }),
      makeRsvp({ event_id: "e1", user_id: "u-bad", status: "bogus" as never }),
      makeRsvp({ event_id: "other", user_id: "u-amy", status: "declined" }),
    ];

    const summary = summarizeEventRsvps("e1", rows, profiles, "u-me");
    expect(summary.myStatus).toBe("declined");
    expect(summary.counts).toEqual({ going: 2, maybe: 1, declined: 2 });
    expect(summary.respondents).toEqual([
      {
        userId: "u-me",
        displayName: "You",
        isCurrentUser: true,
        avatarUrl: "https://example.com/me.png",
        status: "declined",
      },
      {
        userId: "u-amy",
        displayName: "Amy",
        isCurrentUser: false,
        avatarUrl: null,
        status: "going",
      },
      {
        userId: "u-zoe",
        displayName: "Zoe",
        isCurrentUser: false,
        avatarUrl: "https://example.com/zoe.png",
        status: "going",
      },
      {
        userId: "u-blank",
        displayName: "Member",
        isCurrentUser: false,
        avatarUrl: null,
        status: "maybe",
      },
      {
        userId: "u-missing",
        displayName: "Member",
        isCurrentUser: false,
        avatarUrl: null,
        status: "declined",
      },
    ]);
  });

  it("hides declined events when showDeclinedEvents is false and keeps them when true", () => {
    const events = [
      { id: "1", myRsvp: null },
      { id: "2", myRsvp: "going" as const },
      { id: "3", myRsvp: "maybe" as const },
      { id: "4", myRsvp: "declined" as const },
    ];
    expect(filterVisibleEvents(events, false).map((e) => e.id)).toEqual(["1", "2", "3"]);
    expect(filterVisibleEvents(events, true).map((e) => e.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("excludes declined events from conflict candidates whether hidePastConflicts is true or false", () => {
    const nowMs = new Date("2026-11-05T12:00:00Z").getTime();
    const events = [
      { id: "past-going", ends_at: "2026-11-04T10:00:00Z", myRsvp: "going" as const },
      { id: "past-declined", ends_at: "2026-11-04T10:00:00Z", myRsvp: "declined" as const },
      { id: "future-going", ends_at: "2026-11-06T10:00:00Z", myRsvp: "going" as const },
      { id: "future-maybe", ends_at: "2026-11-06T10:00:00Z", myRsvp: "maybe" as const },
      { id: "future-unanswered", ends_at: "2026-11-06T10:00:00Z", myRsvp: null },
      { id: "future-declined", ends_at: "2026-11-06T10:00:00Z", myRsvp: "declined" as const },
    ];

    expect(
      filterConflictCandidateEvents(events, { hidePastConflicts: false, nowMs }).map((e) => e.id),
    ).toEqual(["past-going", "future-going", "future-maybe", "future-unanswered"]);

    expect(
      filterConflictCandidateEvents(events, { hidePastConflicts: true, nowMs }).map((e) => e.id),
    ).toEqual(["future-going", "future-maybe", "future-unanswered"]);
  });

  it("configures REPLICA IDENTITY FULL on public.event_rsvps so Realtime DELETE events retain group_id for RLS", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20261105230000_event_rsvps.sql"),
      "utf8",
    );
    expect(sql).toMatch(/alter\s+table\s+public\.event_rsvps\s+replica\s+identity\s+full\s*;/i);
  });
});

