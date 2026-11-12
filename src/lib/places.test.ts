import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  bboxAround,
  eventsForPlace,
  filterPlaces,
  isPlaceKind,
  isWithinSearchRadius,
  matchWorkspacePlaces,
  hitsMatchingQuery,
  labelNominatimHit,
  labelPhotonFeature,
  mergePlaceSearchHits,
  notesForPlace,
  nominatimSearchUrl,
  photonReverseUrl,
  parseSearchFocus,
  photonSearchFocus,
  photonSearchUrl,
  photoPinHtml,
  placeTitleMatches,
  thumbnailFromWikipedia,
  esriSuggestUrl,
  suggestionsFromEsri,
  labelEsriCandidate,
  labelEsriReverse,
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

  it("matches workspace pins by name or address before Photon", () => {
    const places = [
      place({ id: "pho79", name: "Pho 79", address: "Westminster Blvd", kind: "favorite" }),
      place({ id: "hike", name: "Black Star Canyon", kind: "want_to_go" }),
    ];
    expect(matchWorkspacePlaces(places, "pho").map((p) => p.id)).toEqual(["pho79"]);
    expect(matchWorkspacePlaces(places, "WESTMINSTER").map((p) => p.id)).toEqual(["pho79"]);
    expect(matchWorkspacePlaces(places, "  ").map((p) => p.id)).toEqual([]);
    expect(
      hitsMatchingQuery(
        [
          { lat: 33.7, lng: -117.9, name: "Jack in the Box", address: "Westminster", label: "Westminster" },
          { lat: 34, lng: -118, name: "In-N-Out", address: "Irvine", label: "Irvine" },
        ],
        "jack in the",
      ).map((h) => h.name),
    ).toEqual(["Jack in the Box"]);
  });

  it("uses a place photo only when the article is that place", () => {
    expect(placeTitleMatches("Jack in the Box", "Jack in the Box")).toBe(true);
    expect(placeTitleMatches("Jack in the Box", "Jack in the Box (restaurant)")).toBe(true);
    expect(placeTitleMatches("Pho Lovers", "Egg coffee")).toBe(false);
    expect(placeTitleMatches("Test", "Test cricket")).toBe(false);
    const html = photoPinHtml({
      color: "#8b5cf6",
      imageUrl: "https://example.com/jack.png",
      selected: true,
    });
    expect(html).toContain("https://example.com/jack.png");
    expect(html).toContain("is-selected");
    expect(photoPinHtml({ color: "#8b5cf6", imageUrl: "javascript:alert(1)" })).toBe("");
    expect(
      thumbnailFromWikipedia(
        { query: { pages: { "1": { title: "Egg coffee", thumbnail: { source: "https://example.com/egg.jpg" } } } } },
        "Pho Lovers",
      ),
    ).toBeNull();
    expect(
      thumbnailFromWikipedia(
        {
          query: {
            pages: {
              "1": { title: "Jack in the Box", thumbnail: { source: "https://example.com/jack.png" } },
            },
          },
        },
        "Jack in the Box",
      ),
    ).toBe("https://example.com/jack.png");
  });

  it("completes a prefix to nearby places and skips the brand-only row", () => {
    const url = esriSuggestUrl("jack in", { lat: 33.74, lng: -117.94 });
    expect(url).toContain("/suggest?");
    expect(url).toContain("text=jack+in");
    expect(decodeURIComponent(url)).toContain("location=-117.94,33.74");
    expect(url).toContain("searchExtent=");
    expect(
      suggestionsFromEsri({
        suggestions: [
          { text: "Jack in the Box", magicKey: "brand", isCollection: true },
          { text: "Jack in the Box, 15521 Brookhurst St, Westminster, CA", magicKey: "store", isCollection: false },
        ],
      }),
    ).toEqual([
      { label: "Jack in the Box, 15521 Brookhurst St, Westminster, CA", magicKey: "store" },
    ]);
    expect(
      labelEsriCandidate({
        location: { x: -117.955083, y: 33.737212 },
        attributes: { PlaceName: "Jack in the Box", Place_addr: "15521 Brookhurst St, Westminster, California, 92683" },
      }),
    ).toMatchObject({ name: "Jack in the Box", lat: 33.737212, lng: -117.955083 });
    expect(
      labelEsriReverse({ PlaceName: "Pho Lovers", LongLabel: "Pho Lovers, 9325 Bolsa Ave, Westminster, CA" }),
    ).toEqual({ name: "Pho Lovers", address: "Pho Lovers, 9325 Bolsa Ave, Westminster, CA" });
  });

  it("biases Photon search to a lat/lon and reverse-geocodes a click", () => {
    expect(photonSearchUrl("pho")).not.toMatch(/[?&]lat=/);
    expect(photonSearchUrl("pho", { lat: 33.74, lng: -117.87 })).toContain("lat=33.74");
    expect(photonSearchUrl("pho", { lat: 33.74, lng: -117.87 })).toContain("lon=-117.87");
    expect(photonSearchUrl("pho", { lat: 33.74, lng: -117.87 })).toContain("location_bias_scale=0.6");
    expect(photonReverseUrl(33.74, -117.87)).toContain("lat=33.74");
    expect(photonReverseUrl(33.74, -117.87)).toContain("lon=-117.87");

    const labeled = labelPhotonFeature({
      geometry: { coordinates: [-117.87, 33.74] },
      properties: { name: "The Garden", street: "Euclid St", city: "Garden Grove", country: "United States" },
    });
    expect(labeled).toEqual({
      lat: 33.74,
      lng: -117.87,
      name: "The Garden",
      address: "The Garden, Euclid St, Garden Grove, United States",
    });
  });

  it("does not treat missing lat/lng as Null Island", () => {
    expect(parseSearchFocus(null, null)).toBeNull();
    expect(parseSearchFocus("", "-117.94")).toBeNull();
    expect(parseSearchFocus("33.77", "")).toBeNull();
    expect(parseSearchFocus("nope", "-117.94")).toBeNull();
    expect(parseSearchFocus("33.77", "-117.94")).toEqual(
      photonSearchFocus({ lat: 33.77, lng: -117.94 }),
    );
    expect(parseSearchFocus("0", "0")).toEqual(photonSearchFocus({ lat: 0, lng: 0 }));
  });

  it("keeps Photon search inside a local bbox around the user or map center", () => {
    const gardenGrove = { lat: 33.77, lng: -117.94 };
    const focus = photonSearchFocus(gardenGrove, {
      center: gardenGrove,
      bbox: { minLat: 20, minLng: -130, maxLat: 50, maxLng: -70 },
    });
    expect(focus?.bbox).toEqual(bboxAround(33.77, -117.94, 200));
    expect(photonSearchUrl("pho", focus)).not.toContain("bbox=");
    expect(isWithinSearchRadius(33.78, -117.9, gardenGrove)).toBe(true);
    expect(isWithinSearchRadius(39.9, 116.4, gardenGrove)).toBe(false);
    expect(isWithinSearchRadius(42.36, -71.06, gardenGrove)).toBe(false);

    const nomiUrl = nominatimSearchUrl("pho lovers", focus?.bbox);
    expect(nomiUrl).not.toContain("bounded=");
    expect(nomiUrl).toContain("viewbox=");
    expect(nomiUrl).toContain("limit=20");

    const phoLovers = labelNominatimHit({
      lat: "33.7451424",
      lon: "-117.9665028",
      name: "Phở Lovers",
      display_name: "Phở Lovers, 9325, Bolsa Avenue, Westminster, California, United States",
    });
    expect(phoLovers.name).toBe("Phở Lovers");
    expect(
      mergePlaceSearchHits(
        [
          [phoLovers],
          [{ lat: 39.9, lng: 116.4, name: "Beijing", address: "China", label: "China" }],
        ],
        gardenGrove,
      ),
    ).toEqual([phoLovers]);

    const losAngeles = {
      lat: 34.025,
      lng: -118.278,
      name: "Jack in the Box",
      address: "Los Angeles",
      label: "Los Angeles",
    };
    const westminster = {
      lat: 33.737,
      lng: -117.955,
      name: "Jack in the Box",
      address: "Westminster",
      label: "Westminster",
    };
    expect(mergePlaceSearchHits([[losAngeles, westminster]], gardenGrove).map((h) => h.address)).toEqual([
      "Westminster",
      "Los Angeles",
    ]);
  });

  it("enforces REPLICA IDENTITY FULL and same-group place_id validation in a dedicated post-places migration", () => {
    const basePlacesSql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20261107200000_places.sql"),
      "utf8",
    );
    expect(basePlacesSql).not.toMatch(/enforce_place_same_group/i);

    const hardeningSql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20261107210000_places_hardening.sql"),
      "utf8",
    );
    expect(hardeningSql).toMatch(/alter\s+table\s+public\.places\s+replica\s+identity\s+full\s*;/i);
    expect(hardeningSql).toMatch(/enforce_place_same_group/i);
  });
});
