import type { CalendarEvent } from "@/lib/events";
import { useCreatorColorAccent } from "@/lib/calendarPrefs";
import { getEventCreatorColor } from "@/components/EventCreatorBadge";

export interface EventTagStripesProps {
  event: CalendarEvent;
  /**
   * Hex colours for the event's tags, in selection order.
   * colors[0] is the primary tag (used for the chip background).
   * colors[1] is the secondary tag, shown as a block behind the creator badge.
   */
  colors?: string[];
  /** Width of the left block (should cover the creator badge). */
  width: string;
  radius?: string;
}

/**
 * Renders the left block of an event chip, behind the creator badge.
 * - "Show creator colour" setting on → always the creator's favourite colour.
 * - Otherwise → the secondary tag colour; with 0–1 tags nothing is rendered,
 *   so the whole chip shows the primary colour.
 */
export function EventTagStripes({
  event,
  colors = [],
  width,
  radius = "var(--radius-sm)",
}: EventTagStripesProps) {
  const useCreatorColor = useCreatorColorAccent();
  const background = useCreatorColor ? getEventCreatorColor(event) : colors[1];
  if (!background) return null;

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 z-0"
      style={{
        width,
        background,
        borderRadius: `${radius} 0 0 ${radius}`,
      }}
    />
  );
}
