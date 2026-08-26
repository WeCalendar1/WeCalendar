import { describe, expect, it } from "vitest";
import {
  conflictFingerprint,
  conflictingEventIds,
  draftOverlapsExisting,
  rangesOverlap,
} from "./scheduling";

describe("rangesOverlap", () => {
  it("detects overlapping ranges", () => {
    expect(rangesOverlap(0, 10, 5, 15)).toBe(true);
    expect(rangesOverlap(5, 15, 0, 10)).toBe(true);
  });

  it("allows back-to-back half-open ranges", () => {
    expect(rangesOverlap(0, 10, 10, 20)).toBe(false);
    expect(rangesOverlap(10, 20, 0, 10)).toBe(false);
  });

  it("returns false for separated ranges", () => {
    expect(rangesOverlap(0, 5, 10, 15)).toBe(false);
  });
});

describe("conflictingEventIds", () => {
  it("returns empty set when nothing overlaps", () => {
    const ids = conflictingEventIds([
      { id: "a", starts_at: "2025-06-15T09:00:00.000Z", ends_at: "2025-06-15T10:00:00.000Z" },
      { id: "b", starts_at: "2025-06-15T10:00:00.000Z", ends_at: "2025-06-15T11:00:00.000Z" },
    ]);
    expect(ids.size).toBe(0);
  });

  it("marks both events when they overlap", () => {
    const ids = conflictingEventIds([
      { id: "a", starts_at: "2025-06-15T09:00:00.000Z", ends_at: "2025-06-15T10:30:00.000Z" },
      { id: "b", starts_at: "2025-06-15T10:00:00.000Z", ends_at: "2025-06-15T11:00:00.000Z" },
      { id: "c", starts_at: "2025-06-15T12:00:00.000Z", ends_at: "2025-06-15T13:00:00.000Z" },
    ]);
    expect([...ids].sort()).toEqual(["a", "b"]);
  });
});

describe("draftOverlapsExisting", () => {
  const events = [
    {
      id: "a",
      title: "Team sync",
      starts_at: "2025-06-15T09:00:00.000Z",
      ends_at: "2025-06-15T10:00:00.000Z",
    },
  ];

  it("reports overlapping titles", () => {
    const result = draftOverlapsExisting(
      new Date("2025-06-15T09:30:00.000Z"),
      new Date("2025-06-15T10:30:00.000Z"),
      events,
    );
    expect(result.overlaps).toBe(true);
    expect(result.titles).toEqual(["Team sync"]);
  });

  it("ignores excluded event ids", () => {
    const result = draftOverlapsExisting(
      new Date("2025-06-15T09:30:00.000Z"),
      new Date("2025-06-15T10:30:00.000Z"),
      events,
      ["a"],
    );
    expect(result.overlaps).toBe(false);
  });
});

describe("conflictFingerprint", () => {
  it("sorts ids for a stable key", () => {
    expect(conflictFingerprint(["b", "a"])).toBe("a,b");
  });
});
