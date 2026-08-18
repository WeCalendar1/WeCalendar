import { describe, it, expect } from "vitest";
import { colorForEvent, tagIdsForEvent, TAG_PALETTE } from "./tags";
import type { EventTag, Tag } from "./tags";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const tagA: Tag = {
  id: "tag-a",
  group_id: "group-1",
  name: "Work",
  color: "#0ea5e9",
  created_by: "user-1",
  created_at: "2025-06-01T00:00:00Z",
  updated_at: "2025-06-01T00:00:00Z",
};

const tagB: Tag = {
  id: "tag-b",
  group_id: "group-1",
  name: "Personal",
  color: "#f43f5e",
  created_by: "user-1",
  created_at: "2025-06-01T00:00:00Z",
  updated_at: "2025-06-01T00:00:00Z",
};

const eventTags: EventTag[] = [
  { event_id: "event-1", tag_id: "tag-a" },
  { event_id: "event-1", tag_id: "tag-b" },
  { event_id: "event-2", tag_id: "tag-b" },
];

// ── TAG_PALETTE ───────────────────────────────────────────────────────────────

describe("TAG_PALETTE", () => {
  it("has at least 1 colour", () => {
    expect(TAG_PALETTE.length).toBeGreaterThanOrEqual(1);
  });

  it("all entries are valid hex colours", () => {
    TAG_PALETTE.forEach((c) => {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it("first colour is used as the default", () => {
    expect(TAG_PALETTE[0]).toBeDefined();
  });
});

// ── colorForEvent ─────────────────────────────────────────────────────────────

describe("colorForEvent", () => {
  it("returns the first tag colour for an event", () => {
    const color = colorForEvent("event-1", eventTags, [tagA, tagB]);
    // event-1 has tag-a first (preserves insertion order)
    expect(color).toBe(tagA.color);
  });

  it("returns the colour for event-2 (only tagB)", () => {
    const color = colorForEvent("event-2", eventTags, [tagA, tagB]);
    expect(color).toBe(tagB.color);
  });

  it("returns undefined for an event with no tags", () => {
    const color = colorForEvent("event-3", eventTags, [tagA, tagB]);
    expect(color).toBeUndefined();
  });

  it("returns undefined when eventTags list is empty", () => {
    const color = colorForEvent("event-1", [], [tagA, tagB]);
    expect(color).toBeUndefined();
  });

  it("returns undefined when tags list is empty (tag deleted)", () => {
    const color = colorForEvent("event-1", eventTags, []);
    expect(color).toBeUndefined();
  });
});

// ── tagIdsForEvent ────────────────────────────────────────────────────────────

describe("tagIdsForEvent", () => {
  it("returns all tag IDs for an event", () => {
    const ids = tagIdsForEvent("event-1", eventTags);
    expect(ids).toEqual(expect.arrayContaining(["tag-a", "tag-b"]));
    expect(ids).toHaveLength(2);
  });

  it("returns a single ID when event has one tag", () => {
    const ids = tagIdsForEvent("event-2", eventTags);
    expect(ids).toEqual(["tag-b"]);
  });

  it("returns an empty array for an event with no tags", () => {
    const ids = tagIdsForEvent("event-99", eventTags);
    expect(ids).toEqual([]);
  });

  it("returns an empty array when eventTags list is empty", () => {
    const ids = tagIdsForEvent("event-1", []);
    expect(ids).toEqual([]);
  });
});
