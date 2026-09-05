"use client";

import { useEffect } from "react";
import {
  bulkMoveFolderOptions,
  noteTitle,
  type Note,
  type NoteFolder,
} from "@/lib/notes";
import { FolderColorIcon } from "./NotesFolderDialog";

type NotesMoveToFolderDialogProps = {
  open: boolean;
  notes: Note[];
  folders: NoteFolder[];
  busy?: boolean;
  onClose: () => void;
  onMove: (folderId: string | null) => void | Promise<void>;
};

export function NotesMoveToFolderDialog({
  open,
  notes,
  folders,
  busy = false,
  onClose,
  onMove,
}: NotesMoveToFolderDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || notes.length === 0) return null;

  const bulk = bulkMoveFolderOptions(notes, folders);
  const isBulk = notes.length > 1;
  const allInFolder = (folderId: string | null) =>
    notes.every((note) => (note.folder_id ?? null) === folderId);

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
        aria-labelledby="move-note-dialog-title"
        className="flex w-full max-w-sm flex-col p-5"
        style={{
          borderRadius: "var(--radius-xl)",
          background: "var(--surface)",
          boxShadow: "var(--shadow-lg)",
          border: "1.5px solid var(--border)",
          maxHeight: "min(70vh, 28rem)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="move-note-dialog-title"
          className="text-lg font-semibold"
          style={{
            color: "var(--foreground)",
            fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
          }}
        >
          Move to folder
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {isBulk
            ? `Choose where to file ${notes.length} notes`
            : `Choose where to file “${noteTitle(notes[0]!)}”`}
        </p>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {!bulk.ok ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {bulk.reason === "mixed-visibility"
                ? "Selected notes include both shared and private notes. Move them separately, or change visibility first."
                : "No notes selected."}
            </p>
          ) : (
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onMove(null)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium disabled:opacity-60"
                  style={{
                    background: allInFolder(null) ? "var(--accent-muted)" : "var(--surface-2)",
                    color: allInFolder(null) ? "var(--accent)" : "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span aria-hidden>📄</span>
                  No folder
                  {allInFolder(null) && (
                    <span className="ml-auto text-xs font-semibold" style={{ color: "var(--accent)" }}>
                      Current
                    </span>
                  )}
                </button>
              </li>
              {bulk.folders.map((folder) => {
                const isCurrent = allInFolder(folder.id);
                return (
                  <li key={folder.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onMove(folder.id)}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium disabled:opacity-60"
                      style={{
                        background: isCurrent ? "var(--accent-muted)" : "var(--surface-2)",
                        color: isCurrent ? "var(--accent)" : "var(--foreground)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <FolderColorIcon color={folder.color} />
                      <span className="min-w-0 truncate">{folder.name}</span>
                      {isCurrent && (
                        <span
                          className="ml-auto shrink-0 text-xs font-semibold"
                          style={{ color: "var(--accent)" }}
                        >
                          Current
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {bulk.ok && bulk.folders.length === 0 && (
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              No {bulk.visibility} folders yet. Create one in the sidebar, then move{" "}
              {isBulk ? "these notes" : "this note"} there.
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-end">
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
        </div>
      </div>
    </div>
  );
}
