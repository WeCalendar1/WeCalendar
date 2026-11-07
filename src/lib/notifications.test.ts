import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_NOTIFICATION_PREFS,
  consumePendingOpenTarget,
  countUnreadNotifications,
  formatNotificationRelativeTime,
  isMissingColumnOrRelationError,
  normalizeNotificationPrefs,
  readLocalNotificationPrefs,
  resolveNotificationNavigation,
  unansweredMemberIdsForEvent,
  writeLocalNotificationPrefs,
} from "./notifications";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("notifications domain helpers", () => {
  it("normalizes partial, null, array, or malformed notification_preferences safely", () => {
    expect(normalizeNotificationPrefs(null)).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(normalizeNotificationPrefs(["events"])).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(
      normalizeNotificationPrefs({
        events: false,
        invites: "yes",
        lists: true,
      }),
    ).toEqual({
      events: false,
      invites: true,
      lists: true,
      nudges: true,
    });
  });

  it("round-trips notification preferences via localStorage fallback", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
      },
    });

    expect(readLocalNotificationPrefs()).toEqual(DEFAULT_NOTIFICATION_PREFS);
    writeLocalNotificationPrefs({
      events: false,
      invites: true,
      lists: true,
      nudges: false,
    });
    expect(readLocalNotificationPrefs()).toEqual({
      events: false,
      invites: true,
      lists: true,
      nudges: false,
    });
  });

  it("counts unread notifications and formats relative timestamps cleanly", () => {
    expect(
      countUnreadNotifications([
        { read_at: null },
        { read_at: "2026-11-07T01:00:00Z" },
        { read_at: null },
      ]),
    ).toBe(2);

    const nowMs = new Date("2026-11-07T12:00:00Z").getTime();
    expect(formatNotificationRelativeTime("2026-11-07T11:59:40Z", nowMs)).toBe("Just now");
    expect(formatNotificationRelativeTime("2026-11-07T11:55:00Z", nowMs)).toBe("5m ago");
    expect(formatNotificationRelativeTime("2026-11-07T09:00:00Z", nowMs)).toBe("3h ago");
    expect(formatNotificationRelativeTime("2026-11-06T10:00:00Z", nowMs)).toBe("Yesterday");
    expect(formatNotificationRelativeTime("2026-11-03T10:00:00Z", nowMs)).toBe("4d ago");
  });

  it("identifies unanswered group members for an event while excluding current user and valid respondents", () => {
    const unanswered = unansweredMemberIdsForEvent(
      "e1",
      ["u-me", "u-going", "u-declined", "u-other-event", "u-silent"],
      [
        { event_id: "e1", user_id: "u-going", status: "going" },
        { event_id: "e1", user_id: "u-declined", status: "declined" },
        { event_id: "e2", user_id: "u-other-event", status: "going" },
      ],
      "u-me",
    );
    expect(unanswered).toEqual(["u-other-event", "u-silent"]);
  });

  it("detects missing column or relation error codes and enforces SQL RLS/Realtime invariants", () => {
    expect(isMissingColumnOrRelationError({ code: "42P01", message: "" })).toBe(true);
    expect(isMissingColumnOrRelationError({ code: "42703", message: "" })).toBe(true);
    expect(isMissingColumnOrRelationError({ code: "PGRST204", message: "" })).toBe(true);
    expect(isMissingColumnOrRelationError({ code: "PGRST205", message: "" })).toBe(true);
    expect(isMissingColumnOrRelationError({ code: "42501", message: "permission denied" })).toBe(
      false,
    );

    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20261107013000_notifications_and_nudges.sql"),
      "utf8",
    );
    expect(sql).toMatch(/alter\s+table\s+public\.notifications\s+replica\s+identity\s+full\s*;/i);
    expect(sql).toMatch(/revoke\s+all\s+on\s+function\s+public\.send_availability_nudge/i);
    expect(sql).not.toMatch(/on\s+public\.notifications\s+for\s+insert/i);
    expect(sql).toMatch(
      /after\s+insert\s+or\s+update\s+of\s+label\s*,\s*checked\s+on\s+public\.list_items/i,
    );
  });

  it("resolves contextual notification navigation across active, sibling, and departed workspaces", () => {
    expect(
      resolveNotificationNavigation(
        { group_id: "g2", event_id: "ev-9", note_id: null },
        { activeGroupId: "g1", memberGroupIds: ["g1", "g2"], loadedEventIds: ["ev-1"] },
      ),
    ).toEqual({
      switchToGroupId: "g2",
      screenView: "calendar",
      eventId: "ev-9",
      noteId: null,
      deferEventOpenForGroupId: "g2",
      reloadEventsForGroupId: null,
      deferNoteOpenForGroupId: null,
      reloadNotesForGroupId: null,
    });

    expect(
      resolveNotificationNavigation(
        { group_id: "g1", event_id: null, note_id: "note-4" },
        {
          activeGroupId: "g1",
          memberGroupIds: ["g1", "g2"],
          loadedEventIds: ["ev-1"],
          loadedNoteIds: ["note-4"],
        },
      ),
    ).toEqual({
      switchToGroupId: null,
      screenView: "notes",
      eventId: null,
      noteId: "note-4",
      deferEventOpenForGroupId: null,
      reloadEventsForGroupId: null,
      deferNoteOpenForGroupId: null,
      reloadNotesForGroupId: null,
    });

    expect(
      resolveNotificationNavigation(
        { group_id: "g2", event_id: null, note_id: "note-remote" },
        {
          activeGroupId: "g1",
          memberGroupIds: ["g1", "g2"],
          loadedNoteIds: ["note-4"],
        },
      ),
    ).toEqual({
      switchToGroupId: "g2",
      screenView: "notes",
      eventId: null,
      noteId: "note-remote",
      deferEventOpenForGroupId: null,
      reloadEventsForGroupId: null,
      deferNoteOpenForGroupId: "g2",
      reloadNotesForGroupId: null,
    });

    expect(
      resolveNotificationNavigation(
        { group_id: "g-left", event_id: "ev-1", note_id: null },
        { activeGroupId: "g1", memberGroupIds: ["g1"], loadedEventIds: ["ev-1"] },
      ),
    ).toBeNull();
  });

  it("defers opening and triggers reload when clicking a brand-new event or note notification in the active workspace before rows refresh", () => {
    expect(
      resolveNotificationNavigation(
        { group_id: "g1", event_id: "ev-just-created", note_id: null },
        { activeGroupId: "g1", memberGroupIds: ["g1"], loadedEventIds: ["ev-existing"] },
      ),
    ).toEqual({
      switchToGroupId: null,
      screenView: "calendar",
      eventId: "ev-just-created",
      noteId: null,
      deferEventOpenForGroupId: "g1",
      reloadEventsForGroupId: "g1",
      deferNoteOpenForGroupId: null,
      reloadNotesForGroupId: null,
    });

    expect(
      resolveNotificationNavigation(
        { group_id: "g1", event_id: null, note_id: "note-just-created" },
        { activeGroupId: "g1", memberGroupIds: ["g1"], loadedNoteIds: ["note-existing"] },
      ),
    ).toEqual({
      switchToGroupId: null,
      screenView: "notes",
      eventId: null,
      noteId: "note-just-created",
      deferEventOpenForGroupId: null,
      reloadEventsForGroupId: null,
      deferNoteOpenForGroupId: "g1",
      reloadNotesForGroupId: "g1",
    });

    expect(
      resolveNotificationNavigation(
        { group_id: "g1", event_id: "ev-existing", note_id: null },
        { activeGroupId: "g1", memberGroupIds: ["g1"], loadedEventIds: ["ev-existing"] },
      ),
    ).toEqual({
      switchToGroupId: null,
      screenView: "calendar",
      eventId: "ev-existing",
      noteId: null,
      deferEventOpenForGroupId: null,
      reloadEventsForGroupId: null,
      deferNoteOpenForGroupId: null,
      reloadNotesForGroupId: null,
    });
  });

  it("preserves pendingOpenTarget across stale fetches until the target row appears", () => {
    const pending = { groupId: "g1", targetId: "ev-new" };

    // Stale fetch for the same group where ev-new isn't in the payload yet: keep pending!
    expect(consumePendingOpenTarget(pending, "g1", [{ id: "ev-old" }])).toEqual({
      matched: null,
      nextPending: pending,
    });

    // Fetch for a different group: keep pending!
    expect(consumePendingOpenTarget(pending, "g2", [{ id: "ev-new" }])).toEqual({
      matched: null,
      nextPending: pending,
    });

    // Subsequent fetch containing ev-new: match and clear pending!
    expect(
      consumePendingOpenTarget(pending, "g1", [{ id: "ev-old" }, { id: "ev-new" }]),
    ).toEqual({
      matched: { id: "ev-new" },
      nextPending: null,
    });
  });
});
