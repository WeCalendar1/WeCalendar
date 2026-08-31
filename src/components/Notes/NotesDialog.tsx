"use client";

import { type FormEvent, useEffect, useState } from "react";

type NotesDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  mode: "prompt" | "confirm";
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  secondaryLabel?: string;
  inputType?: string;
  danger?: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (value?: string) => void | Promise<void>;
};

type NotesDialogContentProps = Omit<NotesDialogProps, "open">;

export function NotesDialog({ open, ...props }: NotesDialogProps) {
  if (!open) return null;
  return <NotesDialogContent {...props} />;
}

function NotesDialogContent({
  title,
  description,
  mode,
  defaultValue = "",
  placeholder,
  confirmLabel,
  cancelLabel = "Cancel",
  secondaryLabel,
  inputType = "text",
  danger = false,
  busy = false,
  onClose,
  onConfirm,
}: NotesDialogContentProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (mode === "prompt") {
      const trimmed = value.trim();
      if (!trimmed) return;
      await onConfirm(trimmed);
      return;
    }
    await onConfirm();
  }

  const primaryLabel =
    confirmLabel ?? (mode === "prompt" ? "Save" : danger ? "Delete" : "Confirm");

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
        aria-labelledby="notes-dialog-title"
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
          id="notes-dialog-title"
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
          {mode === "prompt" && (
            <input
              autoFocus
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 text-sm outline-none"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
                background: "var(--surface)",
              }}
            />
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {secondaryLabel && (
              <button
                type="button"
                onClick={() => void onConfirm("")}
                disabled={busy}
                className="mr-auto cursor-pointer px-1 py-2 text-sm font-semibold disabled:opacity-60"
                style={{ color: "#dc2626" }}
              >
                {secondaryLabel}
              </button>
            )}
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
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={busy || (mode === "prompt" && !value.trim())}
              className="btn-bounce cursor-pointer px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{
                borderRadius: "var(--radius-lg)",
                background: danger ? "#dc2626" : "var(--accent)",
                border: danger ? "1.5px solid #dc2626" : "1.5px solid var(--accent)",
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
