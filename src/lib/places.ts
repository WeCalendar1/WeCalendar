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

export function eventsForPlace<T extends { place_id?: string | null }>(
  events: readonly T[],
  placeId: string,
): T[] {
  return events.filter((event) => event.place_id === placeId);
}

export function notesForPlace<T extends { place_id?: string | null }>(
  notes: readonly T[],
  placeId: string,
): T[] {
  return notes.filter((note) => note.place_id === placeId);
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
