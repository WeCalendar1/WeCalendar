"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  DEFAULT_FOLDER_COLOR,
  FOLDER_COLOR_PALETTE,
  normalizeFolderColor,
  type FolderColor,
} from "@/lib/notes";

type NotesFolderDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  title: string;
  description?: string;
  defaultName?: string;
  defaultColor?: string;
  confirmLabel?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (name: string, color: FolderColor) => void | Promise<void>;
};

export function NotesFolderDialog({
  open,
  mode,
  title,
  description,
  defaultName = "",
  defaultColor = DEFAULT_FOLDER_COLOR,
  confirmLabel,
  busy = false,
  onClose,
  onConfirm,
}: NotesFolderDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <NotesFolderDialogForm
      key={`${mode}:${defaultName}:${defaultColor}`}
      mode={mode}
      title={title}
      description={description}
      defaultName={defaultName}
      defaultColor={defaultColor}
      confirmLabel={confirmLabel}
      busy={busy}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

type NotesFolderDialogFormProps = Omit<NotesFolderDialogProps, "open">;

function NotesFolderDialogForm({
  mode,
  title,
  description,
  defaultName = "",
  defaultColor = DEFAULT_FOLDER_COLOR,
  confirmLabel,
  busy = false,
  onClose,
  onConfirm,
}: NotesFolderDialogFormProps) {
  const [name, setName] = useState(defaultName);
  const [color, setColor] = useState<FolderColor>(normalizeFolderColor(defaultColor));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onConfirm(trimmed, color);
  }

  const primaryLabel = confirmLabel ?? (mode === "create" ? "Create" : "Save");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgb(15 23 42 / 0.35)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-folder-dialog-title"
        className="w-full max-w-sm p-5"
        style={{
          borderRadius: "var(--radius-xl)",
          background: "var(--surface)",
          boxShadow: "var(--shadow-lg)",
          border: "1.5px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="notes-folder-dialog-title"
          className="text-lg font-semibold"
          style={{
            color: "var(--foreground)",
            fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
          }}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              Folder name
            </span>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2.5 text-sm outline-none"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
                background: "var(--surface)",
              }}
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              Folder color
            </p>
            <div className="grid grid-cols-6 gap-2">
              {FOLDER_COLOR_PALETTE.map((swatch) => {
                const selected = color === swatch;
                return (
                  <button
                    key={swatch}
                    type="button"
                    aria-label={`Folder color ${swatch}`}
                    aria-pressed={selected}
                    onClick={() => setColor(swatch)}
                    className="flex cursor-pointer items-center justify-center rounded-full p-0.5 transition-transform"
                    style={{
                      width: "2rem",
                      height: "2rem",
                      transform: selected ? "scale(1.08)" : undefined,
                    }}
                  >
                    <span
                      className="flex h-full w-full items-center justify-center rounded-full"
                      style={{
                        background: swatch,
                        boxShadow: selected ? `0 0 0 2px var(--surface), 0 0 0 4px ${swatch}` : undefined,
                      }}
                    >
                      {selected && (
                        <svg
                          viewBox="0 0 16 16"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M3 8l3.5 3.5L13 4.5" />
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="cursor-pointer px-4 py-2 text-sm font-semibold disabled:opacity-60"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
                background: "var(--surface)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="btn-bounce cursor-pointer px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{
                borderRadius: "var(--radius-lg)",
                background: "var(--accent)",
                border: "1.5px solid var(--accent)",
              }}
            >
              {busy ? "Please wait…" : primaryLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FolderColorIcon({ color, className = "h-4 w-4" }: { color: string; className?: string }) {
  const fill = normalizeFolderColor(color);
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} aria-hidden>
      <path
        d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-3z"
        fill={fill}
      />
    </svg>
  );
}
