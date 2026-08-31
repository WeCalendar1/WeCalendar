"use client";

import { useEffect } from "react";
import { foldersForNote, noteTitle, type Note, type NoteFolder } from "@/lib/notes";

type NotesMoveToFolderDialogProps = {
  open: boolean;
  note: Note | null;
  folders: NoteFolder[];
  busy?: boolean;
  onClose: () => void;
  onMove: (folderId: string | null) => void | Promise<void>;
};

export function NotesMoveToFolderDialog({
  open,
  note,
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

  if (!open || !note) return null;

  const eligibleFolders = foldersForNote(note, folders);

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
          Choose where to file &ldquo;{noteTitle(note)}&rdquo;
        </p>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onMove(null)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium disabled:opacity-60"
                style={{
                  background: note.folder_id ? "var(--surface-2)" : "var(--accent-muted)",
                  color: note.folder_id ? "var(--foreground)" : "var(--accent)",
                  border: "1px solid var(--border)",
                }}
              >
                <span aria-hidden>📄</span>
                No folder
                {!note.folder_id && (
                  <span className="ml-auto text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    Current
                  </span>
                )}
              </button>
            </li>
            {eligibleFolders.map((folder) => {
              const isCurrent = note.folder_id === folder.id;
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
                    <span aria-hidden>📁</span>
                    <span className="min-w-0 truncate">{folder.name}</span>
                    {isCurrent && (
                      <span className="ml-auto shrink-0 text-xs font-semibold" style={{ color: "var(--accent)" }}>
                        Current
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {eligibleFolders.length === 0 && (
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              No {note.visibility} folders yet. Create one in the sidebar, then move this note there.
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
