"use client";

import { type FormEvent, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

export function NotesDialog({ open, ...props }: NotesDialogProps) {
  return (
    <AnimatePresence>
      {open && <NotesDialogContent key="notes-dialog-content" {...props} />}
    </AnimatePresence>
  );
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
}: Omit<NotesDialogProps, "open">) {
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
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        className="fixed inset-0"
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-dialog-title"
        className="relative z-10 w-full max-w-sm overflow-hidden p-5"
        style={{
          borderRadius: "var(--radius-xl)",
          background: "var(--surface)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border)",
        }}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: "spring", bounce: 0, duration: 0.28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="notes-dialog-title"
          className="text-base font-semibold tracking-tight"
          style={{
            color: "var(--foreground)",
            letterSpacing: "-0.012em",
          }}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-3.5 space-y-3.5">
          {mode === "prompt" && (
            <input
              autoFocus
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 text-sm outline-none transition-all"
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                background: "var(--surface-2)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {secondaryLabel && (
              <button
                type="button"
                onClick={() => void onConfirm("")}
                disabled={busy}
                className="pressable mr-auto px-1 py-1.5 text-xs font-semibold disabled:opacity-60"
                style={{ color: "var(--color-danger)" }}
              >
                {secondaryLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="pressable px-3.5 py-1.5 text-xs font-medium disabled:opacity-60"
              style={{
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                background: "var(--surface)",
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={busy || (mode === "prompt" && !value.trim())}
              className="pressable px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              style={{
                borderRadius: "var(--radius-full)",
                background: danger ? "var(--color-danger)" : "var(--accent)",
              }}
            >
              {busy ? "Please wait…" : primaryLabel}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
