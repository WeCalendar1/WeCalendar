import { useState } from "react";
import type { CalendarEvent } from "@/lib/events";

export function getEventCreatorColor(event: CalendarEvent): string {
  const preferences = event.creator?.theme_preferences;
  const favorite = preferences && typeof preferences === "object" && !Array.isArray(preferences)
    ? preferences.favorite_color
    : null;
  return typeof favorite === "string" && /^#[0-9a-f]{6}$/i.test(favorite)
    ? favorite
    : "#64748b";
}

export function EventCreatorAccent({
  event,
  width,
  radius = "var(--radius-sm)",
}: {
  event: CalendarEvent;
  width: string;
  radius?: string;
}) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 z-0"
      style={{
        width,
        background: getEventCreatorColor(event),
        borderRadius: `${radius} 0 0 ${radius}`,
      }}
    />
  );
}

export function EventCreatorBadge({ event }: { event: CalendarEvent }) {
  const [imageFailed, setImageFailed] = useState(false);
  const name = event.creator?.display_name?.trim() || "Unknown creator";
  const color = getEventCreatorColor(event);
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
      className="relative z-10 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center overflow-hidden rounded-full align-middle text-[8px] font-bold leading-none"
      style={{ background: color, color: luminance > 0.179 ? "#000" : "#fff", boxShadow: "0 0 0 1px var(--surface)", letterSpacing: 0 }}
    >
      {event.creator?.avatar_url && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.creator.avatar_url}
          alt=""
          onError={() => setImageFailed(true)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : initials}
    </span>
  );
}
