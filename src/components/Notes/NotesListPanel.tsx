"use client";

import type { Note } from "@/lib/notes";
import {
  filterLabel,
  formatNoteDate,
  notePreviewText,
  noteTitle,
  type NoteFolder,
  type NotesFilter,
} from "@/lib/notes";

type NotesListPanelProps = {
  filter: NotesFilter;
  folders: NoteFolder[];
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
};

export function NotesListPanel({
  filter,
  folders,
  notes,
  selectedNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
}: NotesListPanelProps) {
  const heading = filterLabel(filter, folders);

  return (
    <div
      className="flex w-72 shrink-0 flex-col border-r sm:w-80"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            {heading}
          </h2>
          <button
            type="button"
            onClick={onCreateNote}
            className="btn-bounce cursor-pointer px-2.5 py-1 text-xs font-semibold"
            style={{
              borderRadius: "var(--radius-full)",
              background: "var(--accent)",
              color: "#fff",
            }}
          >
            New
          </button>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5"
          style={{
            borderRadius: "var(--radius-full)",
            border: "1.5px solid var(--border)",
            background: "var(--surface-2)",
          }}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--foreground)" }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              No notes here yet
            </p>
            <button
              type="button"
              onClick={onCreateNote}
              className="cursor-pointer text-sm font-semibold"
              style={{ color: "var(--accent)" }}
            >
              Create your first note
            </button>
          </div>
        ) : (
          <ul>
            {notes.map((note) => {
              const selected = note.id === selectedNoteId;
              const preview = notePreviewText(note.content);
              return (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => onSelectNote(note.id)}
                    className="w-full cursor-pointer border-b px-4 py-3 text-left"
                    style={{
                      borderColor: "var(--border)",
                      background: selected ? "var(--accent-muted)" : "transparent",
                      transition: "background var(--transition-fast)",
                    }}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <span
                        className="truncate text-sm font-semibold"
                        style={{ color: selected ? "var(--accent-text)" : "var(--foreground)" }}
                      >
                        {note.is_pinned && (
                          <span className="mr-1" aria-label="Pinned">
                            📌
                          </span>
                        )}
                        {noteTitle(note)}
                      </span>
                      <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatNoteDate(note.updated_at)}
                      </span>
                    </div>
                    {preview && (
                      <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {preview}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {note.visibility === "private" && (
                        <Badge label="Private" />
                      )}
                      {note.event_id && <Badge label="Event" />}
                      {note.linked_date && <Badge label="Date" />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
    >
      {label}
    </span>
  );
}
