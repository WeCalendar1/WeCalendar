import type { Tables } from "@/types/database";

export type Place = Tables<"places">;
export type PlaceKind = Place["kind"];

export const PLACE_KINDS = ["favorite", "want_to_go"] as const;

export const PLACE_KIND_LABEL: Record<PlaceKind, string> = {
  favorite: "Favorite",
  want_to_go: "Want to go",
};

export const PLACE_KIND_COLOR: Record<PlaceKind, string> = {
  favorite: "#f59e0b",
  want_to_go: "#8b5cf6",
};

export function isPlaceKind(value: string): value is PlaceKind {
  return (PLACE_KINDS as readonly string[]).includes(value);
}

const PHOTON_BASE = "https://photon.komoot.io";

export type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

export type MapBias = { lat: number; lng: number };
export type MapBBox = { minLat: number; minLng: number; maxLat: number; maxLng: number };
export type MapView = { center: MapBias; bbox: MapBBox };
export type PhotonSearchFocus = MapBias & { bbox?: MapBBox };

export const PHOTON_SEARCH_RADIUS_KM = 200;

export function bboxAround(lat: number, lng: number, radiusKm: number): MapBBox {
  const dLat = radiusKm / 111;
  const cos = Math.cos((lat * Math.PI) / 180);
  const dLng = radiusKm / (111 * Math.max(Math.abs(cos), 0.2));
  return {
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLng: lng - dLng,
    maxLng: lng + dLng,
  };
}

export function tightenSearchBBox(
  center: MapBias,
  view?: MapBBox | null,
  maxRadiusKm = PHOTON_SEARCH_RADIUS_KM,
): MapBBox {
  const cap = bboxAround(center.lat, center.lng, maxRadiusKm);
  if (!view) return cap;
  const next = {
    minLat: Math.max(cap.minLat, view.minLat),
    maxLat: Math.min(cap.maxLat, view.maxLat),
    minLng: Math.max(cap.minLng, view.minLng),
    maxLng: Math.min(cap.maxLng, view.maxLng),
  };
  if (next.minLat >= next.maxLat || next.minLng >= next.maxLng) return cap;
  return next;
}

export function isWithinSearchRadius(
  lat: number,
  lng: number,
  center: MapBias,
  radiusKm = PHOTON_SEARCH_RADIUS_KM,
): boolean {
  const dLat = (lat - center.lat) * 111;
  const dLng = (lng - center.lng) * 111 * Math.cos((center.lat * Math.PI) / 180);
  return dLat * dLat + dLng * dLng <= radiusKm * radiusKm;
}

export function photonSearchFocus(
  userBias?: MapBias | null,
  mapView?: MapView | null,
): PhotonSearchFocus | null {
  const center = userBias ?? mapView?.center ?? null;
  if (!center) return null;
  return {
    lat: center.lat,
    lng: center.lng,
    bbox: tightenSearchBBox(center, mapView?.bbox),
  };
}

export function photonSearchUrl(query: string, focus?: PhotonSearchFocus | null): string {
  const url = new URL(`${PHOTON_BASE}/api/`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");
  if (focus) {
    url.searchParams.set("lat", String(focus.lat));
    url.searchParams.set("lon", String(focus.lng));
    url.searchParams.set("location_bias_scale", "0.6");
    if (focus.bbox) {
      url.searchParams.set(
        "bbox",
        `${focus.bbox.minLng},${focus.bbox.minLat},${focus.bbox.maxLng},${focus.bbox.maxLat}`,
      );
    }
  }
  return url.toString();
}

export type NominatimHit = {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
};

export type PlaceSearchHit = {
  lat: number;
  lng: number;
  name: string;
  address: string;
  label: string;
};

export function nominatimSearchUrl(query: string, bbox?: MapBBox | null): string {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  if (bbox) {
    url.searchParams.set(
      "viewbox",
      `${bbox.minLng},${bbox.maxLat},${bbox.maxLng},${bbox.minLat}`,
    );
    url.searchParams.set("bounded", "1");
  }
  return url.toString();
}

export function labelNominatimHit(hit: NominatimHit): PlaceSearchHit {
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  const name = hit.name?.trim() || hit.display_name?.split(",")[0]?.trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const address = hit.display_name?.trim() || name;
  return { lat, lng, name, address, label: address };
}

export function mergePlaceSearchHits(
  batches: PlaceSearchHit[][],
  center: MapBias | null,
  limit = 5,
): PlaceSearchHit[] {
  const seen = new Set<string>();
  const merged: PlaceSearchHit[] = [];
  for (const batch of batches) {
    for (const hit of batch) {
      if (!Number.isFinite(hit.lat) || !Number.isFinite(hit.lng)) continue;
      if (center && !isWithinSearchRadius(hit.lat, hit.lng, center)) continue;
      const key = `${hit.lat.toFixed(4)},${hit.lng.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(hit);
      if (merged.length >= limit) return merged;
    }
  }
  return merged;
}

export function photonReverseUrl(lat: number, lng: number): string {
  const url = new URL(`${PHOTON_BASE}/reverse`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  return url.toString();
}

export function labelPhotonFeature(feature: PhotonFeature): {
  lat: number;
  lng: number;
  name: string;
  address: string;
} {
  const [lng, lat] = feature.geometry.coordinates;
  const props = feature.properties;
  const street = [props.housenumber, props.street].filter(Boolean).join(" ");
  const address = [props.name, street, props.city, props.state, props.country]
    .filter(Boolean)
    .join(", ");
  const name = props.name || street || props.city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  return { lat, lng, name, address };
}

export function eventsForPlace<T extends { place_id?: string | null }>(
  events: readonly T[],
  placeId: string,
): T[] {
  return events.filter((event) => event.place_id === placeId);
}

export function notesForPlace<
  T extends { place_id?: string | null; deleted_at?: string | null },
>(
  notes: readonly T[],
  placeId: string,
): T[] {
  return notes.filter((note) => note.place_id === placeId && !note.deleted_at);
}

export function filterPlaces(
  places: readonly Place[],
  filter: "all" | PlaceKind | "events",
  eventPlaceIds: ReadonlySet<string>,
): Place[] {
  if (filter === "all") return [...places];
  if (filter === "events") return places.filter((place) => eventPlaceIds.has(place.id));
  return places.filter((place) => place.kind === filter);
}

export function matchWorkspacePlaces(
  places: readonly Place[],
  query: string,
  limit = 5,
): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matched: Place[] = [];
  for (const place of places) {
    const haystack = `${place.name} ${place.address ?? ""}`.toLowerCase();
    if (!haystack.includes(q)) continue;
    matched.push(place);
    if (matched.length >= limit) break;
  }
  return matched;
}
