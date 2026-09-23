import type { CalendarEvent } from "@/lib/events";

export function EventCreatorBadge({ event }: { event: CalendarEvent }) {
  const name = event.creator?.display_name?.trim() || "Unknown creator";
  const preferences = event.creator?.theme_preferences;
  const favorite = preferences && typeof preferences === "object" && !Array.isArray(preferences)
    ? preferences.favorite_color
    : null;
  const color = typeof favorite === "string" && /^#[0-9a-f]{6}$/i.test(favorite)
    ? favorite
    : "#64748b";
  const initials = event.creator?.display_name?.trim()
    .split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;

  return (
    <span
      title={`Created by ${name}`}
      aria-label={`Created by ${name}`}
      className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full align-middle text-[8px] font-bold leading-none"
      style={{ background: color, color: luminance > 0.179 ? "#000" : "#fff", boxShadow: "0 0 0 1px var(--surface)", letterSpacing: 0 }}
    >
      {initials}
    </span>
  );
}
