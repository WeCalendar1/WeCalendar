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

/** Street-level zoom. Above this, photos can replace the circle. */
export const PLACE_FACE_ZOOM = 15;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === "&") return "&amp;";
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    if (ch === '"') return "&quot;";
    return "&#39;";
  });
}

function safePinColor(color: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#64748b";
}

export function safePinImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function photoPinHtml(input: { color: string; imageUrl: string; selected?: boolean }): string {
  const image = safePinImageUrl(input.imageUrl);
  if (!image) return "";
  const selected = input.selected ? " is-selected" : "";
  return `<div class="map-place-pin${selected}" style="--pin:${safePinColor(input.color)}"><img src="${escapeHtml(image)}" alt="" onerror="this.remove()" /></div>`;
}

export function wikipediaImageUrl(placeName: string): string {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", placeName);
  url.searchParams.set("gsrlimit", "1");
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", "96");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  return url.toString();
}

export function placeTitleMatches(placeName: string, title: string): boolean {
  const words = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  const placeWords = words(placeName);
  const titleWords = words(title);
  if (placeWords.length === 0 || titleWords.length === 0) return false;
  const place = placeWords.join(" ");
  const page = titleWords.join(" ");
  if (place === page) return true;
  const specific = placeWords.length >= 2 || place.length >= 8;
  if (!specific) return false;
  return page.startsWith(`${place} `) || place.startsWith(`${page} `);
}

export function thumbnailFromWikipedia(json: unknown, placeName: string): string | null {
  if (!json || typeof json !== "object" || !("query" in json)) return null;
  const pages = (json as { query?: { pages?: Record<string, { title?: string; thumbnail?: { source?: string } }> } })
    .query?.pages;
  const page = pages ? Object.values(pages)[0] : undefined;
  const title = page?.title?.trim();
  const source = page?.thumbnail?.source;
  if (!title || !source || !placeTitleMatches(placeName, title)) return null;
  return safePinImageUrl(source);
}

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

const ESRI_GEOCODE = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

export type PlaceSuggestion = {
  label: string;
  magicKey: string;
};

export function esriSuggestUrl(query: string, focus?: MapBias | null, radiusKm = 80): string {
  const url = new URL(`${ESRI_GEOCODE}/suggest`);
  url.searchParams.set("text", query);
  url.searchParams.set("f", "json");
  url.searchParams.set("maxSuggestions", "6");
  if (focus) {
    url.searchParams.set("location", `${focus.lng},${focus.lat}`);
    const box = bboxAround(focus.lat, focus.lng, radiusKm);
    url.searchParams.set("searchExtent", `${box.minLng},${box.minLat},${box.maxLng},${box.maxLat}`);
  }
  return url.toString();
}

export function suggestionsFromEsri(json: {
  suggestions?: { text?: string; magicKey?: string; isCollection?: boolean }[];
}): PlaceSuggestion[] {
  const rows: PlaceSuggestion[] = [];
  for (const row of json.suggestions ?? []) {
    if (row.isCollection) continue;
    const label = row.text?.trim();
    const magicKey = row.magicKey?.trim();
    if (!label || !magicKey) continue;
    rows.push({ label, magicKey });
    if (rows.length >= 5) break;
  }
  return rows;
}

export function esriCandidatesUrl(magicKey: string): string {
  const url = new URL(`${ESRI_GEOCODE}/findAddressCandidates`);
  url.searchParams.set("magicKey", magicKey);
  url.searchParams.set("f", "json");
  url.searchParams.set("maxLocations", "1");
  url.searchParams.set("outFields", "PlaceName,Place_addr");
  return url.toString();
}

export type EsriCandidate = {
  address?: string;
  location?: { x?: number; y?: number };
  attributes?: { PlaceName?: string; Place_addr?: string };
};

export function labelEsriCandidate(candidate: EsriCandidate): PlaceSearchHit | null {
  const lat = candidate.location?.y;
  const lng = candidate.location?.x;
  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  const name = candidate.attributes?.PlaceName?.trim() || candidate.address?.trim() || "Dropped pin";
  const address = candidate.attributes?.Place_addr?.trim() || candidate.address?.trim() || name;
  const label = address.toLowerCase().includes(name.toLowerCase()) ? address : `${name}, ${address}`;
  return { lat, lng, name, address, label };
}

export type EsriAddress = {
  PlaceName?: string;
  ShortLabel?: string;
  LongLabel?: string;
  Address?: string;
  City?: string;
  Region?: string;
};

export function esriReverseUrl(lat: number, lng: number): string {
  const url = new URL(`${ESRI_GEOCODE}/reverseGeocode`);
  url.searchParams.set("location", `${lng},${lat}`);
  url.searchParams.set("f", "json");
  return url.toString();
}

export function labelEsriReverse(address: EsriAddress): { name: string; address: string } {
  const name =
    address.PlaceName?.trim() || address.ShortLabel?.trim() || address.Address?.trim() || "Dropped pin";
  const line =
    address.LongLabel?.trim() ||
    [address.Address, address.City, address.Region].filter(Boolean).join(", ");
  return { name, address: line || name };
}

export function photonSearchUrl(query: string, focus?: PhotonSearchFocus | null): string {
  const url = new URL(`${PHOTON_BASE}/api/`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");
  if (focus) {
    url.searchParams.set("lat", String(focus.lat));
    url.searchParams.set("lon", String(focus.lng));
    url.searchParams.set("location_bias_scale", "0.6");
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
  url.searchParams.set("limit", "20");
  if (bbox) {
    url.searchParams.set(
      "viewbox",
      `${bbox.minLng},${bbox.maxLat},${bbox.maxLng},${bbox.minLat}`,
    );
  }
  return url.toString();
}

export function searchDistanceKm(lat: number, lng: number, center: MapBias): number {
  const dLat = (lat - center.lat) * 111;
  const dLng = (lng - center.lng) * 111 * Math.cos((center.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
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
    }
  }
  if (center) {
    merged.sort(
      (a, b) => searchDistanceKm(a.lat, a.lng, center) - searchDistanceKm(b.lat, b.lng, center),
    );
  }
  return merged.slice(0, limit);
}

export function labelPhotonHit(feature: PhotonFeature): PlaceSearchHit {
  const labeled = labelPhotonFeature(feature);
  return { ...labeled, label: labeled.address };
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

export function hitsMatchingQuery(hits: readonly PlaceSearchHit[], query: string): PlaceSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return hits.filter((hit) => `${hit.name} ${hit.address}`.toLowerCase().includes(q));
}
