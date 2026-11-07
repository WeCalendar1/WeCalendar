import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  eventsForPlace,
  filterPlaces,
  isPlaceKind,
  notesForPlace,
  type Place,
} from "./places";

function place(overrides: Partial<Place> & Pick<Place, "id" | "kind">): Place {
  return {
    group_id: "g1",
    name: overrides.name ?? overrides.id,
    address: null,
    lat: 37.77,
    lng: -122.42,
    created_by: "u1",
    created_at: "2026-11-07T00:00:00Z",
    updated_at: "2026-11-07T00:00:00Z",
    ...overrides,
  };
}

describe("places", () => {
  it("accepts only favorite and want_to_go kinds", () => {
    expect(isPlaceKind("favorite")).toBe(true);
    expect(isPlaceKind("want_to_go")).toBe(true);
    expect(isPlaceKind("home")).toBe(false);
  });

  it("filters events and active (non-trashed) notes linked to a place", () => {
    expect(eventsForPlace([{ place_id: "p1" }, { place_id: "p2" }, { place_id: null }], "p1")).toEqual([
      { place_id: "p1" },
    ]);
    expect(
      notesForPlace(
        [
          { place_id: "p1", deleted_at: null },
          { place_id: "p1", deleted_at: "2026-11-07T05:00:00Z" },
          {},
        ],
        "p1",
      ),
    ).toEqual([{ place_id: "p1", deleted_at: null }]);
  });

  it("filters the shared map by kind or by places that have events", () => {
    const places = [
      place({ id: "cafe", kind: "favorite" }),
      place({ id: "hike", kind: "want_to_go" }),
    ];
    expect(filterPlaces(places, "favorite", new Set()).map((p) => p.id)).toEqual(["cafe"]);
    expect(filterPlaces(places, "events", new Set(["hike"])).map((p) => p.id)).toEqual(["hike"]);
    expect(filterPlaces(places, "all", new Set()).map((p) => p.id)).toEqual(["cafe", "hike"]);
  });

  it("enforces REPLICA IDENTITY FULL and same-group place_id validation in places migration", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20261107200000_places.sql"),
      "utf8",
    );
    expect(sql).toMatch(/alter\s+table\s+public\.places\s+replica\s+identity\s+full\s*;/i);
    expect(sql).toMatch(/enforce_place_same_group/i);
  });
});
