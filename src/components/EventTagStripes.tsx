import React from "react";

export interface EventTagStripesProps {
  /**
   * Array of hex colors for tags on the event, in order.
   * colors[0] is the primary tag (used for the event chip background).
   * colors[1...] are secondary tags rendered as vertical stripes on the left side of the chip.
   */
  colors?: string[];
  /** Maximum number of secondary stripes to display. Defaults to 4. */
  maxStripes?: number;
  /** Width in pixels for each stripe. Defaults to 3.5. */
  stripeWidth?: number;
}

/**
 * Renders thin vertical accent stripes on the left edge of an event chip
 * for secondary tags (Option 3 multi-tag representation).
 */
export function EventTagStripes({
  colors = [],
  maxStripes = 4,
  stripeWidth = 3.5,
}: EventTagStripesProps) {
  if (colors.length <= 1) return null;

  const secondary = colors.slice(1, 1 + maxStripes);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 z-10 flex shrink-0"
    >
      {secondary.map((color, i) => (
        <span
          key={i}
          className="h-full"
          style={{
            width: `${stripeWidth}px`,
            backgroundColor: color,
            boxShadow:
              "inset -0.5px 0 0 rgba(0, 0, 0, 0.25), 0.5px 0 1px rgba(0, 0, 0, 0.1)",
          }}
        />
      ))}
    </span>
  );
}
