import { describe, expect, it, vi } from "vitest";
import {
  fetchAccountExportBundle,
  formatExportFilename,
  serializeAccountExport,
} from "./accountExport";

describe("accountExport", () => {
  it("formats export filename as wecalendar-export-YYYY-MM-DD.json", () => {
    expect(formatExportFilename(new Date(2026, 10, 4, 15, 0))).toBe(
      "wecalendar-export-2026-11-04.json",
    );
  });

  it("handles zero-group users without querying group-scoped tables and preserves null created_by rows", async () => {
    const fromSpy = vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "u1",
                  display_name: "Alex",
                  avatar_url: null,
                  theme_preferences: {},
                  notification_preferences: {
                    events: true,
                    invites: true,
                    lists: false,
                    nudges: true,
                  },
                  created_at: "2026-11-04T00:00:00Z",
                  updated_at: "2026-11-04T00:00:00Z",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "group_members") {
        return {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        };
      }
      if (table === "notifications") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    id: "n1",
                    recipient_id: "u1",
                    actor_id: null,
                    group_id: null,
                    category: "invites",
                    title: "Welcome",
                    body: null,
                    event_id: null,
                    note_id: null,
                    read_at: null,
                    created_at: "2026-11-04T00:00:00Z",
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "calendar_syncs") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: [], error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected query on ${table} when user has zero groups`);
    });

    const bundle = await fetchAccountExportBundle(
      { from: fromSpy } as never,
      { id: "u1", email: "alex@example.com" },
      "2026-11-04T20:00:00.000Z",
    );

    expect(bundle.groups).toEqual([]);
    expect(bundle.events).toEqual([]);
    expect(bundle.eventRsvps).toEqual([]);
    expect(bundle.calendarSyncs).toEqual([]);
    expect(bundle.notifications).toHaveLength(1);
    expect(fromSpy).toHaveBeenCalledTimes(4);

    const parsed = JSON.parse(
      serializeAccountExport({
        ...bundle,
        events: [
          {
            id: "e1",
            group_id: "g1",
            title: "Shared Dinner",
            description: null,
            starts_at: "2026-11-05T18:00:00Z",
            ends_at: "2026-11-05T20:00:00Z",
            created_by: null,
            has_conflict: false,
            recurrence_group_id: null,
            place_id: null,
            sync_id: null,
            external_uid: null,
            created_at: "2026-11-04T00:00:00Z",
            updated_at: "2026-11-04T00:00:00Z",
          },
        ],
      }),
    );
    expect(parsed.events[0].created_by).toBeNull();
  });

  it("fetches all group-scoped entities including event_tags and list_items when user belongs to groups", async () => {
    const fromSpy = vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      }
      if (table === "group_members") {
        return {
          select: () => ({
            eq: async () => ({ data: [{ group_id: "g1" }], error: null }),
          }),
        };
      }
      if (table === "notifications") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === "calendar_syncs") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    id: "cs1",
                    group_id: "g1",
                    user_id: "u1",
                    provider: "ics_url",
                    label: "Work",
                    source_url: "https://example.com/work.ics",
                    last_synced_at: "2026-11-04T00:00:00Z",
                    synced_event_count: 3,
                    created_at: "2026-11-04T00:00:00Z",
                    updated_at: "2026-11-04T00:00:00Z",
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "groups") {
        return {
          select: () => ({
            in: async () => ({
              data: [
                {
                  id: "g1",
                  name: "Home",
                  invite_code: "abcd1234",
                  created_by: "u1",
                  created_at: "2026-11-04T00:00:00Z",
                  updated_at: "2026-11-04T00:00:00Z",
                },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === "events") {
        return {
          select: () => ({
            in: async () => ({
              data: [
                {
                  id: "e1",
                  group_id: "g1",
                  title: "Lunch",
                  description: null,
                  starts_at: "2026-11-05T12:00:00Z",
                  ends_at: "2026-11-05T13:00:00Z",
                  created_by: "u1",
                  has_conflict: false,
                  recurrence_group_id: null,
                  place_id: null,
                  sync_id: null,
                  external_uid: null,
                  created_at: "2026-11-04T00:00:00Z",
                  updated_at: "2026-11-04T00:00:00Z",
                },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === "lists") {
        return {
          select: () => ({
            in: async () => ({
              data: [
                {
                  id: "l1",
                  group_id: "g1",
                  name: "Groceries",
                  category: "grocery",
                  created_by: "u1",
                  created_at: "2026-11-04T00:00:00Z",
                  updated_at: "2026-11-04T00:00:00Z",
                },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === "event_tags") {
        return {
          select: () => ({
            in: async () => ({
              data: [{ event_id: "e1", tag_id: "t1" }],
              error: null,
            }),
          }),
        };
      }
      if (table === "event_rsvps") {
        return {
          select: () => ({
            in: async () => ({
              data: [
                {
                  event_id: "e1",
                  group_id: "g1",
                  user_id: "u1",
                  status: "going",
                  created_at: "2026-11-04T00:00:00Z",
                  updated_at: "2026-11-04T00:00:00Z",
                },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === "list_items") {
        return {
          select: () => ({
            in: async () => ({
              data: [
                {
                  id: "li1",
                  list_id: "l1",
                  content: "Milk",
                  is_checked: false,
                  sort_order: 0,
                  created_by: null,
                  created_at: "2026-11-04T00:00:00Z",
                  updated_at: "2026-11-04T00:00:00Z",
                },
              ],
              error: null,
            }),
          }),
        };
      }
      return {
        select: () => ({
          in: async () => ({ data: [], error: null }),
        }),
      };
    });

    const bundle = await fetchAccountExportBundle(
      { from: fromSpy } as never,
      { id: "u1", email: "alex@example.com" },
      "2026-11-04T20:00:00.000Z",
    );

    expect(bundle.groups).toHaveLength(1);
    expect(bundle.events).toHaveLength(1);
    expect(bundle.eventTags).toEqual([{ event_id: "e1", tag_id: "t1" }]);
    expect(bundle.eventRsvps).toHaveLength(1);
    expect(bundle.calendarSyncs).toHaveLength(1);
    expect(bundle.places).toEqual([]);
    expect(bundle.listItems[0]?.created_by).toBeNull();
  });

  it("degrades eventRsvps to [] when event_rsvps table is not migrated yet", async () => {
    const fromSpy = vi.fn((table: string) => {
      if (table === "profiles") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
      }
      if (table === "group_members") {
        return { select: () => ({ eq: async () => ({ data: [{ group_id: "g1" }], error: null }) }) };
      }
      if (table === "event_rsvps") {
        return {
          select: () => ({
            in: async () => ({
              data: null,
              error: { code: "42P01", message: 'relation "event_rsvps" does not exist' },
            }),
          }),
        };
      }
      if (table === "notifications") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: null,
                error: { code: "42P01", message: 'relation "notifications" does not exist' },
              }),
            }),
          }),
        };
      }
      if (table === "calendar_syncs") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: null,
                error: { code: "42P01", message: 'relation "calendar_syncs" does not exist' },
              }),
            }),
          }),
        };
      }
      return { select: () => ({ in: async () => ({ data: [], error: null }) }) };
    });

    const bundle = await fetchAccountExportBundle(
      { from: fromSpy } as never,
      { id: "u1", email: "a@b.com" },
    );
    expect(bundle.eventRsvps).toEqual([]);
    expect(bundle.notifications).toEqual([]);
    expect(bundle.calendarSyncs).toEqual([]);
  });
});

