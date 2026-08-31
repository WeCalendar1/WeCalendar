"use client";

import { useMemo, useState } from "react";
import type { CalendarEvent } from "@/lib/events";
import type { Note, NoteFolder, NotesFilter } from "@/lib/notes";
import {
  filterNotes,
  searchNotes,
  sortNotesForList,
} from "@/lib/notes";
import { NoteEditor } from "./NoteEditor";
import { NotesFolderSidebar } from "./NotesFolderSidebar";
import { NotesListPanel } from "./NotesListPanel";

export type NoteDraftContext = {
  folderId?: string | null;
  eventId?: string | null;
  linkedDate?: string | null;
  visibility?: "shared" | "private";
};

import type { Tables } from "@/types/database";

type Group = Tables<"groups">;

type NotesAppProps = {
  groupId: string | null;
  groupName: string | null;
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
  folders: NoteFolder[];
  notes: Note[];
  events: CalendarEvent[];
  searchQuery: string;
  filter: NotesFilter;
  selectedNoteId: string | null;
  onFilterChange: (filter: NotesFilter) => void;
  onSelectNote: (noteId: string | null) => void;
  onSearchChange: (query: string) => void;
  onCreateNote: (context?: NoteDraftContext) => Promise<string | null>;
  onUpdateNote: (
    noteId: string,
    patch: Partial<
      Pick<
        Note,
        | "title"
        | "content"
        | "folder_id"
        | "event_id"
        | "linked_date"
        | "visibility"
        | "is_pinned"
      >
    >,
  ) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onCreateFolder: (name: string, visibility: "shared" | "private") => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onRenameFolder: (folderId: string, name: string) => Promise<void>;
};

export function NotesApp({
  groupId,
  groupName,
  groups,
  onSelectGroup,
  folders,
  notes,
  events,
  searchQuery,
  filter,
  selectedNoteId,
  onFilterChange,
  onSelectNote,
  onSearchChange,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
}: NotesAppProps) {
  const [localSearch, setLocalSearch] = useState("");

  const effectiveSearch = localSearch || searchQuery;

  const visibleNotes = useMemo(() => {
    let result = filterNotes(notes, filter);
    result = searchNotes(result, effectiveSearch);
    return sortNotesForList(result);
  }, [notes, filter, effectiveSearch]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  const sharedFolders = folders.filter((f) => f.visibility === "shared");
  const privateFolders = folders.filter((f) => f.visibility === "private");

  async function handleCreateNote() {
    const defaultVisibility =
      filter.type === "private" ? "private" : filter.type === "shared" ? "shared" : "shared";
    const folderId = filter.type === "folder" ? filter.folderId : null;
    const eventId = filter.type === "event" ? filter.eventId : null;
    const linkedDate = filter.type === "date" ? filter.date : null;

    const id = await onCreateNote({
      folderId,
      eventId,
      linkedDate,
      visibility: defaultVisibility,
    });
    if (id) onSelectNote(id);
  }

  function handleLocalSearch(query: string) {
    setLocalSearch(query);
    onSearchChange(query);
  }

  if (!groupId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Join a workspace to use Notes
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Create or join a shared workspace from the calendar sidebar to start writing notes
            with your group.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col">
        {groups.length > 0 && (
          <div
            className="flex items-center gap-2 border-b px-4 py-2"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              Workspace
            </label>
            <select
              value={groupId ?? ""}
              onChange={(e) => onSelectGroup(e.target.value)}
              className="min-w-0 flex-1 cursor-pointer rounded-lg border px-2 py-1 text-sm font-medium outline-none"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-2)",
                color: "var(--foreground)",
              }}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex min-h-0 flex-1 overflow-hidden">
      <NotesFolderSidebar
        filter={filter}
        folders={folders}
        sharedFolderCount={sharedFolders.length}
        privateFolderCount={privateFolders.length}
        onFilterChange={onFilterChange}
        onCreateFolder={onCreateFolder}
        onDeleteFolder={onDeleteFolder}
        onRenameFolder={onRenameFolder}
      />

      <NotesListPanel
        filter={filter}
        folders={folders}
        notes={visibleNotes}
        selectedNoteId={selectedNoteId}
        searchQuery={localSearch}
        onSearchChange={handleLocalSearch}
        onSelectNote={(id) => onSelectNote(id)}
        onCreateNote={() => void handleCreateNote()}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col" style={{ background: "var(--surface)" }}>
        {selectedNote ? (
          <>
            <NoteMetaBar
              note={selectedNote}
              groupName={groupName}
              events={events}
              folders={folders}
              onUpdate={(patch) => void onUpdateNote(selectedNote.id, patch)}
              onDelete={() => {
                if (window.confirm("Delete this note?")) {
                  void onDeleteNote(selectedNote.id).then(() => {
                    onSelectNote(visibleNotes.find((n) => n.id !== selectedNote.id)?.id ?? null);
                  });
                }
              }}
            />
            <NoteEditor
              key={selectedNote.id}
              noteId={selectedNote.id}
              title={selectedNote.title}
              content={selectedNote.content}
              onTitleChange={(title) => void onUpdateNote(selectedNote.id, { title })}
              onContentChange={(content) => void onUpdateNote(selectedNote.id, { content })}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
              Select a note or create a new one
            </p>
            <p className="max-w-sm text-sm" style={{ color: "var(--text-secondary)" }}>
              Shared notes are chapters everyone in {groupName ?? "your workspace"} can read.
              Private notes are only visible to you.
            </p>
            <button
              type="button"
              onClick={() => void handleCreateNote()}
              className="btn-bounce cursor-pointer px-5 py-2 text-sm font-semibold"
              style={{
                borderRadius: "var(--radius-full)",
                background: "var(--accent)",
                color: "#fff",
              }}
            >
              New Note
            </button>
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}

function NoteMetaBar({
  note,
  groupName,
  events,
  folders,
  onUpdate,
  onDelete,
}: {
  note: Note;
  groupName: string | null;
  events: CalendarEvent[];
  folders: NoteFolder[];
  onUpdate: (
    patch: Partial<
      Pick<
        Note,
        | "folder_id"
        | "event_id"
        | "linked_date"
        | "visibility"
        | "is_pinned"
      >
    >,
  ) => void;
  onDelete: () => void;
}) {
  const linkedEvent = note.event_id ? events.find((e) => e.id === note.event_id) : null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b px-4 py-2"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <select
        value={note.visibility}
        onChange={(e) => onUpdate({ visibility: e.target.value as "shared" | "private" })}
        className="cursor-pointer rounded-lg border px-2 py-1 text-xs font-medium outline-none"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
        aria-label="Note visibility"
      >
        <option value="shared">Shared with {groupName ?? "workspace"}</option>
        <option value="private">Private (only me)</option>
      </select>

      <select
        value={note.folder_id ?? ""}
        onChange={(e) => onUpdate({ folder_id: e.target.value || null })}
        className="cursor-pointer rounded-lg border px-2 py-1 text-xs font-medium outline-none"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
        aria-label="Folder"
      >
        <option value="">No folder</option>
        {folders
          .filter((f) => f.visibility === note.visibility)
          .map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
      </select>

      <select
        value={note.event_id ?? ""}
        onChange={(e) => onUpdate({ event_id: e.target.value || null })}
        className="max-w-[10rem] cursor-pointer truncate rounded-lg border px-2 py-1 text-xs font-medium outline-none"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
        aria-label="Linked event"
      >
        <option value="">No linked event</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={note.linked_date ?? ""}
        onChange={(e) => onUpdate({ linked_date: e.target.value || null })}
        className="cursor-pointer rounded-lg border px-2 py-1 text-xs font-medium outline-none"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
        aria-label="Linked date"
      />

      {linkedEvent && (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Linked to {linkedEvent.title}
        </span>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => onUpdate({ is_pinned: !note.is_pinned })}
          className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold"
          style={{
            background: note.is_pinned ? "var(--accent-muted)" : "var(--surface)",
            color: note.is_pinned ? "var(--accent)" : "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          {note.is_pinned ? "Pinned" : "Pin"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold"
          style={{ color: "#dc2626", border: "1px solid var(--border)", background: "var(--surface)" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
