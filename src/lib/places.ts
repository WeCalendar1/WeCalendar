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

export function photonSearchUrl(query: string, bias?: MapBias | null): string {
  const url = new URL(`${PHOTON_BASE}/api/`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");
  if (bias) {
    url.searchParams.set("lat", String(bias.lat));
    url.searchParams.set("lon", String(bias.lng));
  }
  return url.toString();
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
