"use client";

import { useState } from "react";
import {
  folderForNote,
  folderBadgeStyle,
  formatNoteDate,
  noteShowsPrivateLock,
  filterLabel,
  NOTE_DRAG_IDS_MIME,
  NOTES_SORT_OPTIONS,
  noteIdsForDrag,
  notePreviewText,
  noteTitle,
  writeNoteDragData,
  type Note,
  type NoteFolder,
  type NotesFilter,
  type NotesSort,
} from "@/lib/notes";

const PRIVATE_LOCK_ICON = (
  <svg
    viewBox="0 0 24 24"
    className="h-3.5 w-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

type NotesListPanelProps = {
  filter: NotesFilter;
  folders: NoteFolder[];
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  sort: NotesSort;
  draggingNoteIds: readonly string[];
  collapsed: boolean;
  selectionMode: boolean;
  selectedNoteIds: ReadonlySet<string>;
  onToggleCollapse: () => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: NotesSort) => void;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onEmptyTrash: () => void;
  onDragNoteStart: (noteIds: string[]) => void;
  onDragNoteEnd: () => void;
  onRequestMoveNote: (note: Note) => void;
  onToggleSelectionMode: () => void;
  onToggleNoteSelection: (noteId: string) => void;
  onSelectAllNotes: () => void;
  onClearNoteSelection: () => void;
  onBulkMove: () => void;
  onBulkDelete: () => void;
};

export function NotesListPanel({
  filter,
  folders,
  notes,
  selectedNoteId,
  searchQuery,
  sort,
  draggingNoteIds,
  collapsed,
  selectionMode,
  selectedNoteIds,
  onToggleCollapse,
  onSearchChange,
  onSortChange,
  onSelectNote,
  onCreateNote,
  onEmptyTrash,
  onDragNoteStart,
  onDragNoteEnd,
  onRequestMoveNote,
  onToggleSelectionMode,
  onToggleNoteSelection,
  onSelectAllNotes,
  onClearNoteSelection,
  onBulkMove,
  onBulkDelete,
}: NotesListPanelProps) {
  const [menuNoteId, setMenuNoteId] = useState<string | null>(null);
  const heading = filterLabel(filter, folders);
  const selectedCount = selectedNoteIds.size;
  const allVisibleSelected = notes.length > 0 && notes.every((note) => selectedNoteIds.has(note.id));
  const someVisibleSelected = notes.some((note) => selectedNoteIds.has(note.id));

  return (
    <div
      className="flex shrink-0 flex-col overflow-hidden"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
        width: collapsed ? 0 : undefined,
        minWidth: collapsed ? 0 : undefined,
        maxWidth: collapsed ? 0 : undefined,
        transition: "width 0.25s ease, min-width 0.25s ease, max-width 0.25s ease",
        ...(collapsed ? {} : { width: "20rem" }),
      }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            {heading}
          </h2>
          <div className="flex items-center gap-1">
            {selectionMode ? (
              <button
                type="button"
                onClick={onToggleSelectionMode}
                className="btn-bounce cursor-pointer px-2.5 py-1 text-xs font-semibold"
                style={{
                  borderRadius: "var(--radius-full)",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                Cancel
              </button>
            ) : filter.type === "trash" ? (
              <button
                type="button"
                onClick={onEmptyTrash}
                className="btn-bounce cursor-pointer px-2.5 py-1 text-xs font-semibold"
                style={{
                  borderRadius: "var(--radius-full)",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "#dc2626",
                }}
              >
                Empty Trash
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onToggleSelectionMode}
                  disabled={notes.length === 0}
                  className="btn-bounce cursor-pointer px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    borderRadius: "var(--radius-full)",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  Select
                </button>
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
              </>
            )}
            {!selectionMode && filter.type === "trash" && notes.length > 0 && (
              <button
                type="button"
                onClick={onToggleSelectionMode}
                className="btn-bounce cursor-pointer px-2.5 py-1 text-xs font-semibold"
                style={{
                  borderRadius: "var(--radius-full)",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                Select
              </button>
            )}
          </div>
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
        <label className="mt-2 flex items-center gap-2">
          <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            Sort
          </span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as NotesSort)}
            className="min-w-0 flex-1 cursor-pointer rounded-lg border px-2 py-1 text-xs font-medium outline-none"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
            aria-label="Sort notes"
          >
            {NOTES_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {selectionMode && notes.length > 0 && (
          <label className="mt-2 flex cursor-pointer items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              ref={(input) => {
                if (input) input.indeterminate = someVisibleSelected && !allVisibleSelected;
              }}
              onChange={() => {
                if (allVisibleSelected) onClearNoteSelection();
                else onSelectAllNotes();
              }}
              className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--accent)]"
              aria-label="Select all notes"
            />
            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              {selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
            </span>
          </label>
        )}
        {draggingNoteIds.length > 0 && (
          <p className="mt-2 text-xs" style={{ color: "var(--accent)" }}>
            {draggingNoteIds.length > 1
              ? `Drop ${draggingNoteIds.length} notes onto a folder in the sidebar to move them.`
              : "Drop a note onto a folder in the sidebar to move it."}
          </p>
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {filter.type === "trash" ? "Trash is empty" : "No notes here yet"}
            </p>
            {filter.type !== "trash" && (
              <button
                type="button"
                onClick={onCreateNote}
                className="cursor-pointer text-sm font-semibold"
                style={{ color: "var(--accent)" }}
              >
                Create your first note
              </button>
            )}
          </div>
        ) : (
          <ul>
            {notes.map((note) => {
              const selected = note.id === selectedNoteId;
              const checked = selectedNoteIds.has(note.id);
              const preview = notePreviewText(note.content);
              const folder = folderForNote(note, folders);
              const showPrivateLock = noteShowsPrivateLock(note, folders);
              const isDragging = draggingNoteIds.includes(note.id);
              const menuOpen = menuNoteId === note.id;
              const rowHighlighted =
                selectionMode ? checked || isDragging : selected || isDragging;

              return (
                <li
                  key={note.id}
                  draggable
                  onDragStart={(e) => {
                    if ((e.target as HTMLElement).closest("[data-note-no-drag]")) {
                      e.preventDefault();
                      return;
                    }
                    const dragIds = noteIdsForDrag(note.id, selectionMode, selectedNoteIds);
                    writeNoteDragData(e.dataTransfer, dragIds);
                    onDragNoteStart(dragIds);
                  }}
                  onDragEnd={onDragNoteEnd}
                  onClick={() => {
                    if (selectionMode) onToggleNoteSelection(note.id);
                    else onSelectNote(note.id);
                  }}
                  className="group relative cursor-grab border-b active:cursor-grabbing"
                  style={{
                    borderColor: "var(--border)",
                    background: rowHighlighted ? "var(--accent-muted)" : "transparent",
                    boxShadow: isDragging ? "inset 0 0 0 2px var(--accent)" : undefined,
                    opacity: isDragging ? 0.65 : 1,
                    transition:
                      "background var(--transition-fast), box-shadow var(--transition-fast), opacity var(--transition-fast)",
                  }}
                >
                  <div className="flex items-stretch px-4 py-3 pr-2">
                    {selectionMode && (
                      <div className="mr-3 flex shrink-0 items-start pt-0.5" data-note-no-drag>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleNoteSelection(note.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                          aria-label={`Select ${noteTitle(note)}`}
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-left">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <span
                          className="flex min-w-0 items-center gap-1 truncate text-sm font-semibold"
                          style={{
                            color: rowHighlighted ? "var(--accent-text)" : "var(--foreground)",
                          }}
                        >
                          {note.is_pinned && (
                            <span className="shrink-0" aria-label="Pinned">
                              📌
                            </span>
                          )}
                          {showPrivateLock && (
                            <span
                              className="shrink-0"
                              style={{ color: "#7c3aed" }}
                              aria-label="Private note"
                              title="Private note"
                            >
                              {PRIVATE_LOCK_ICON}
                            </span>
                          )}
                          <span className="truncate">{noteTitle(note)}</span>
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
                        {folder && <Badge label={folder.name} folderColor={folder.color} />}
                        {note.event_id && <Badge label="Event" />}
                        {note.linked_date && <Badge label="Date" />}
                      </div>
                    </div>

                    {!selectionMode && (
                      <div className="relative flex shrink-0 items-start" data-note-action>
                      <button
                        type="button"
                        draggable={false}
                        aria-label={`Note actions for ${noteTitle(note)}`}
                        aria-expanded={menuOpen}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuNoteId(menuOpen ? null : note.id);
                        }}
                        className="cursor-pointer rounded-md px-1.5 py-1 text-sm opacity-0 transition-opacity group-hover:opacity-100"
                        style={{
                          color: "var(--text-muted)",
                          background: menuOpen ? "var(--surface-2)" : "transparent",
                        }}
                      >
                        ⋯
                      </button>
                      {menuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            aria-hidden
                            onClick={() => setMenuNoteId(null)}
                          />
                          <div
                            className="absolute right-0 top-8 z-20 min-w-[10rem] py-1"
                            style={{
                              borderRadius: "var(--radius-md)",
                              border: "1px solid var(--border)",
                              background: "var(--surface)",
                              boxShadow: "var(--shadow-md)",
                            }}
                          >
                            <button
                              type="button"
                              className="flex w-full cursor-pointer px-3 py-2 text-left text-sm font-medium"
                              style={{ color: "var(--foreground)" }}
                              onClick={() => {
                                setMenuNoteId(null);
                                onRequestMoveNote(note);
                              }}
                            >
                              Move to folder…
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {selectionMode && selectedCount > 0 && (
          <div
            className="sticky bottom-0 flex items-center gap-2 border-t px-4 py-3"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
              boxShadow: "0 -4px 12px rgb(15 23 42 / 0.08)",
            }}
          >
            <span className="min-w-0 flex-1 truncate text-xs font-semibold" style={{ color: "var(--foreground)" }}>
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={onBulkMove}
              className="btn-bounce cursor-pointer px-2.5 py-1 text-xs font-semibold"
              style={{
                borderRadius: "var(--radius-full)",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              Move
            </button>
            <button
              type="button"
              onClick={onBulkDelete}
              className="btn-bounce cursor-pointer px-2.5 py-1 text-xs font-semibold"
              style={{
                borderRadius: "var(--radius-full)",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "#dc2626",
              }}
            >
              {filter.type === "trash" ? "Delete Forever" : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ label, folderColor }: { label: string; folderColor?: string }) {
  const folderStyles = folderColor ? folderBadgeStyle(folderColor) : null;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide"
      style={{
        background: folderStyles?.background ?? "var(--surface-2)",
        color: folderStyles?.color ?? "var(--text-muted)",
        border: folderStyles?.border ?? "1px solid transparent",
        textTransform: folderColor ? "none" : "uppercase",
      }}
    >
      {label}
    </span>
  );
}
