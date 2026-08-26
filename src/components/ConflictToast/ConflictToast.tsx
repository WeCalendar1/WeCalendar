"use client";

type ConflictToastProps = {
  open: boolean;
  titles: string[];
  onDismiss: () => void;
  onHideHighlights: () => void;
};

export function ConflictToast({
  open,
  titles,
  onDismiss,
  onHideHighlights,
}: ConflictToastProps) {
  if (!open) return null;

  const preview = titles.slice(0, 3);
  const extra = titles.length - preview.length;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 right-3 z-50 w-[min(100%-1.5rem,20rem)] p-3 sm:right-4"
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1.5px solid #fca5a5",
        background: "var(--surface)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <p className="text-sm font-semibold" style={{ color: "#b91c1c" }}>
        Scheduling conflict
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
        {titles.length === 1
          ? "1 event overlaps another on the calendar."
          : `${titles.length} events overlap on the calendar.`}
      </p>
      {preview.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {preview.map((title) => (
            <li
              key={title}
              className="truncate text-xs font-medium"
              style={{ color: "var(--foreground)" }}
            >
              · {title}
            </li>
          ))}
          {extra > 0 && (
            <li className="text-xs" style={{ color: "var(--text-muted)" }}>
              +{extra} more
            </li>
          )}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="cursor-pointer px-2.5 py-1 text-xs font-semibold"
          style={{
            borderRadius: "var(--radius-md)",
            border: "1.5px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--foreground)",
          }}
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={onHideHighlights}
          className="cursor-pointer px-2.5 py-1 text-xs font-semibold"
          style={{
            borderRadius: "var(--radius-md)",
            border: "1.5px solid #fca5a5",
            background: "#fff5f5",
            color: "#b91c1c",
          }}
        >
          Hide highlights
        </button>
      </div>
    </div>
  );
}
