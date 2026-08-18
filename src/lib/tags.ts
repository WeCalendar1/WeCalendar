import type { Tables } from "@/types/database";

export type Tag = Tables<"tags">;
export type EventTag = Tables<"event_tags">;

/** 5 quick-pick preset colours shown alongside the full colour picker */
export const TAG_PALETTE = [
  "#6366f1", // indigo
  "#f43f5e", // rose
  "#10b981", // emerald
  "#f59e0b", // amber
  "#0ea5e9", // sky
];

/**
 * Returns the hex colour for the first tag attached to an event,
 * or undefined (caller should fall back to var(--accent)).
 */
export function colorForEvent(
  eventId: string,
  eventTags: EventTag[],
  tags: Tag[],
): string | undefined {
  const tagId = eventTags.find((et) => et.event_id === eventId)?.tag_id;
  if (!tagId) return undefined;
  return tags.find((t) => t.id === tagId)?.color;
}

/** Returns the tag IDs attached to a specific event */
export function tagIdsForEvent(eventId: string, eventTags: EventTag[]): string[] {
  return eventTags.filter((et) => et.event_id === eventId).map((et) => et.tag_id);
}
