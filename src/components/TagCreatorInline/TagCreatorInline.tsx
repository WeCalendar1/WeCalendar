"use client";

import { useState } from "react";
import { TAG_PALETTE } from "@/lib/tags";

type TagCreatorInlineProps = {
  onAdd: (name: string, color: string) => Promise<void>;
};

export function TagCreatorInline({ onAdd }: TagCreatorInlineProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_PALETTE[0]!);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd(name.trim(), color);
      setName("");
      setColor(TAG_PALETTE[0]!);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create tag.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex cursor-pointer items-center gap-1.5 px-2 py-1.5 text-xs font-semibold transition-opacity duration-150 hover:opacity-70"
        style={{ color: "var(--accent)" }}
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M8 3v10M3 8h10" />
        </svg>
        New tag
      </button>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-2"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void handleAdd();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Tag name"
        className="px-2 py-1.5 text-xs outline-none"
        style={{
          borderRadius: "var(--radius-lg)",
          border: "1.5px solid var(--border)",
          background: "var(--surface-2)",
          color: "var(--foreground)",
        }}
      />

      {/* Quick presets + custom colour picker */}
      <div className="flex items-center gap-2">
        {/* Preset swatches (reduced to 5) */}
        <div className="flex gap-1.5">
          {TAG_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              title={c}
              className="h-5 w-5 shrink-0 cursor-pointer transition-transform duration-100"
              style={{
                borderRadius: "var(--radius-full)",
                background: c,
                outline: color === c ? `2.5px solid ${c}` : "none",
                outlineOffset: "2px",
                transform: color === c ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="h-4 w-px shrink-0" style={{ background: "var(--border)" }} />

        {/* Native colour picker — shows the selected colour as a small swatch */}
        <label
          title="Custom colour"
          className="relative flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center overflow-hidden"
          style={{
            borderRadius: "var(--radius-full)",
            border: `2px solid ${color}`,
            background: "transparent",
          }}
        >
          {/* Colour wheel icon */}
          <svg viewBox="0 0 16 16" className="h-3 w-3 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 2a6 6 0 010 12" strokeWidth="1" />
          </svg>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            title="Pick a custom colour"
          />
        </label>

        {/* Preview swatch of current colour */}
        <span
          className="h-5 w-5 shrink-0 rounded-full"
          style={{ background: color }}
          title={color}
        />
      </div>

      {error && (
        <p className="text-[10px]" style={{ color: "#b91c1c" }}>{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => void handleAdd()}
          className="btn-bounce flex-1 cursor-pointer py-1 text-xs font-semibold text-white disabled:opacity-50"
          style={{ borderRadius: "var(--radius-lg)", background: color }}
        >
          {busy ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="cursor-pointer px-3 py-1 text-xs font-semibold"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1.5px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
