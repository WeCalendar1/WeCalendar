"use client";

import { useMemo, useState } from "react";
import type { CalendarEvent } from "@/lib/events";
import { formatLinkedEventLabel } from "@/lib/eventPicker";
import type { Note, NoteFolder, NotesFilter, NotesSort } from "@/lib/notes";
import type { EventTag, Tag } from "@/lib/tags";
import {
  canMoveNoteToFolder,
  DEFAULT_NOTES_SORT,
  filterNotes,
  searchNotes,
  sortNotesForList,
} from "@/lib/notes";
import { NoteEditor } from "./NoteEditor";
import { NotesDialog } from "./NotesDialog";
import { NotesFolderSidebar } from "./NotesFolderSidebar";
import { NotesListPanel } from "./NotesListPanel";
import { NotesLinkEventDialog } from "./NotesLinkEventDialog";
import { NotesMoveToFolderDialog } from "./NotesMoveToFolderDialog";

import type { Tables, Json } from "@/types/database";

export type NoteDraftContext = {
  folderId?: string | null;
  eventId?: string | null;
  linkedDate?: string | null;
  visibility?: "shared" | "private";
};

type Group = Tables<"groups">;

type NotesAppProps = {
  groupId: string | null;
  groupName: string | null;
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => Promise<void>;
  onJoinGroup: (inviteCode: string) => Promise<void>;
  folders: NoteFolder[];
  notes: Note[];
  events: CalendarEvent[];
  eventTags: EventTag[];
  tags: Tag[];
  searchQuery: string;
  filter: NotesFilter;
  selectedNoteId: string | null;
  onFilterChange: (filter: NotesFilter) => void;
  onSelectNote: (noteId: string | null) => void;
  onSearchChange: (query: string) => void;
  onCreateNote: (context?: NoteDraftContext) => Promise<string | null>;
  onNoteDraftChange: (noteId: string, patch: { title?: string; content?: Json }) => void;
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
  onRestoreNote: (noteId: string) => Promise<void>;
  onPermanentlyDeleteNote: (noteId: string) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
  onCreateFolder: (name: string, visibility: "shared" | "private", color: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onUpdateFolder: (folderId: string, patch: { name: string; color: string }) => Promise<void>;
};

export function NotesApp({
  groupId,
  groupName,
  groups,
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
  folders,
  notes,
  events,
  eventTags,
  tags,
  searchQuery,
  filter,
  selectedNoteId,
  onFilterChange,
  onSelectNote,
  onSearchChange,
  onCreateNote,
  onNoteDraftChange,
  onUpdateNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentlyDeleteNote,
  onEmptyTrash,
  onCreateFolder,
  onDeleteFolder,
  onUpdateFolder,
}: NotesAppProps) {
  const [localSearch, setLocalSearch] = useState("");
  const [deleteNoteTarget, setDeleteNoteTarget] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [moveNoteTarget, setMoveNoteTarget] = useState<Note | null>(null);
  const [moveBusy, setMoveBusy] = useState(false);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [notesSort, setNotesSort] = useState<NotesSort>(DEFAULT_NOTES_SORT);
  const [listPanelOpen, setListPanelOpen] = useState(true);

  const effectiveSearch = localSearch || searchQuery;

  const visibleNotes = useMemo(() => {
    let result = filterNotes(notes, filter);
    result = searchNotes(result, effectiveSearch);
    return sortNotesForList(result, notesSort);
  }, [notes, filter, effectiveSearch, notesSort]);

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

  function requestDeleteNote(note: Note) {
    setDeleteNoteTarget({ id: note.id, title: note.title.trim() || "Untitled note" });
  }

  async function confirmDeleteNote() {
    if (!deleteNoteTarget) return;
    setDeleteBusy(true);
    try {
      if (filter.type === "trash") {
        await onPermanentlyDeleteNote(deleteNoteTarget.id);
      } else {
        await onDeleteNote(deleteNoteTarget.id);
      }
      onSelectNote(visibleNotes.find((n) => n.id !== deleteNoteTarget.id)?.id ?? null);
      setDeleteNoteTarget(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleMoveNoteToFolder(noteId: string, folderId: string | null) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    if (folderId) {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder || !canMoveNoteToFolder(note, folder)) return;
    }
    if (note.folder_id === folderId && !note.deleted_at) return;
    
    if (note.deleted_at) {
      await onRestoreNote(note.id);
    }
    if (note.folder_id !== folderId) {
      await onUpdateNote(noteId, { folder_id: folderId });
    }
  }

  async function confirmMoveNote(folderId: string | null) {
    if (!moveNoteTarget) return;
    setMoveBusy(true);
    try {
      await handleMoveNoteToFolder(moveNoteTarget.id, folderId);
      setMoveNoteTarget(null);
    } finally {
      setMoveBusy(false);
    }
  }

  function handleDropNoteOnFolder(folderId: string | null) {
    if (!draggingNoteId) return;
    void handleMoveNoteToFolder(draggingNoteId, folderId);
    setDraggingNoteId(null);
    setDragOverTarget(null);
  }

  function handleDropNoteOnTrash() {
    if (!draggingNoteId) return;
    void onDeleteNote(draggingNoteId);
    setDraggingNoteId(null);
    setDragOverTarget(null);
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
      <NotesFolderSidebar
        filter={filter}
        folders={folders}
        sharedFolderCount={sharedFolders.length}
        privateFolderCount={privateFolders.length}
        groups={groups}
        activeGroupId={groupId}
        onSelectGroup={onSelectGroup}
        onCreateGroup={onCreateGroup}
        onJoinGroup={onJoinGroup}
        onFilterChange={onFilterChange}
        onCreateFolder={onCreateFolder}
        onDeleteFolder={onDeleteFolder}
        onUpdateFolder={onUpdateFolder}
        draggingNoteId={draggingNoteId}
        dragOverTarget={dragOverTarget}
        onDragOverTarget={setDragOverTarget}
        onDropNoteOnFolder={handleDropNoteOnFolder}
        onDropNoteOnTrash={handleDropNoteOnTrash}
      />

      <NotesListPanel
        filter={filter}
        folders={folders}
        notes={visibleNotes}
        selectedNoteId={selectedNoteId}
        searchQuery={localSearch}
        sort={notesSort}
        draggingNoteId={draggingNoteId}
        collapsed={!listPanelOpen}
        onToggleCollapse={() => setListPanelOpen((v) => !v)}
        onSearchChange={handleLocalSearch}
        onSortChange={setNotesSort}
        onSelectNote={(id) => onSelectNote(id)}
        onCreateNote={() => void handleCreateNote()}
        onEmptyTrash={() => void onEmptyTrash()}
        onDragNoteStart={setDraggingNoteId}
        onDragNoteEnd={() => {
          setDraggingNoteId(null);
          setDragOverTarget(null);
        }}
        onRequestMoveNote={setMoveNoteTarget}
      />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col" style={{ background: "var(--surface)" }}>

        {selectedNote ? (
          <>
            <NoteMetaBar
              note={selectedNote}
              listPanelOpen={listPanelOpen}
              onToggleListPanel={() => setListPanelOpen((v) => !v)}
              groupName={groupName}
              events={events}
              eventTags={eventTags}
              tags={tags}
              folders={folders}
              onUpdate={(patch) => void onUpdateNote(selectedNote.id, patch)}
              onDelete={() => requestDeleteNote(selectedNote)}
              onRestore={() => void onRestoreNote(selectedNote.id)}
            />
            <NoteEditor
              key={selectedNote.id}
              noteId={selectedNote.id}
              title={selectedNote.title}
              content={selectedNote.content}
              readOnly={!!selectedNote.deleted_at}
              onDraftChange={(patch) => onNoteDraftChange(selectedNote.id, patch)}
              onSave={(patch) => void onUpdateNote(selectedNote.id, patch)}
            />
          </>
        ) : (
          <div className="relative flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="absolute left-4 top-4">
              <ListPanelToggleButton open={listPanelOpen} onToggle={() => setListPanelOpen((v) => !v)} />
            </div>
            {filter.type !== "trash" && (
              <>
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
              </>
            )}
          </div>
        )}
      </div>

      <NotesDialog
        open={deleteNoteTarget !== null}
        title={
          deleteNoteTarget
            ? filter.type === "trash"
              ? `Permanently delete "${deleteNoteTarget.title}"?`
              : `Delete "${deleteNoteTarget.title}"?`
            : ""
        }
        description={
          filter.type === "trash"
            ? "This note will be permanently removed. This cannot be undone."
            : "This note will be moved to the trash."
        }
        mode="confirm"
        danger
        busy={deleteBusy}
        confirmLabel={filter.type === "trash" ? "Permanently Delete" : "Move to Trash"}
        onClose={() => setDeleteNoteTarget(null)}
        onConfirm={confirmDeleteNote}
      />

      <NotesMoveToFolderDialog
        open={moveNoteTarget !== null}
        note={moveNoteTarget}
        folders={folders}
        busy={moveBusy}
        onClose={() => setMoveNoteTarget(null)}
        onMove={confirmMoveNote}
      />
    </div>
  );
}

function NoteMetaBar({
  note,
  listPanelOpen,
  onToggleListPanel,
  groupName,
  events,
  eventTags,
  tags,
  folders,
  onUpdate,
  onDelete,
  onRestore,
}: {
  note: Note;
  listPanelOpen: boolean;
  onToggleListPanel: () => void;
  groupName: string | null;
  events: CalendarEvent[];
  eventTags: EventTag[];
  tags: Tag[];
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
  onRestore: () => void;
}) {
  const [linkEventOpen, setLinkEventOpen] = useState(false);
  const linkedEvent = note.event_id ? events.find((e) => e.id === note.event_id) : null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b px-4 py-2"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <ListPanelToggleButton open={listPanelOpen} onToggle={onToggleListPanel} />
      
      <select
        value={note.visibility}
        onChange={(e) => onUpdate({ visibility: e.target.value as "shared" | "private" })}
        disabled={!!note.deleted_at}
        className={`rounded-lg border px-2 py-1 text-xs font-medium outline-none ${note.deleted_at ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
        aria-label="Note visibility"
      >
        <option value="shared">Shared with {groupName ?? "workspace"}</option>
        <option value="private">Private (only me)</option>
      </select>

      <select
        value={note.folder_id ?? ""}
        onChange={(e) => onUpdate({ folder_id: e.target.value || null })}
        disabled={!!note.deleted_at}
        className={`rounded-lg border px-2 py-1 text-xs font-medium outline-none ${note.deleted_at ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
        aria-label="Move to folder"
        title="Move to folder"
      >
        <option value="">Move to folder…</option>
        {folders
          .filter((f) => f.visibility === note.visibility)
          .map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
      </select>

      <button
        type="button"
        disabled={!!note.deleted_at}
        onClick={() => setLinkEventOpen(true)}
        className={`max-w-[14rem] truncate rounded-lg border px-2 py-1 text-left text-xs font-medium outline-none ${note.deleted_at ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
        aria-label="Link to calendar event"
        title={linkedEvent ? formatLinkedEventLabel(linkedEvent) : "Choose a calendar event"}
      >
        {linkedEvent ? formatLinkedEventLabel(linkedEvent) : "Link event…"}
      </button>

      <NotesLinkEventDialog
        open={linkEventOpen}
        events={events}
        eventTags={eventTags}
        tags={tags}
        selectedEventId={note.event_id}
        onClose={() => setLinkEventOpen(false)}
        onSelect={(eventId) => {
          onUpdate({ event_id: eventId });
          setLinkEventOpen(false);
        }}
      />

      <input
        type="date"
        disabled={!!note.deleted_at}
        value={note.linked_date ?? ""}
        onChange={(e) => onUpdate({ linked_date: e.target.value || null })}
        className={`rounded-lg border px-2 py-1 text-xs font-medium outline-none ${note.deleted_at ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
        aria-label="Linked date"
      />

      {note.deleted_at ? (
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onRestore}
            className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{
              background: "var(--accent)",
              color: "#fff",
            }}
          >
            Restore
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{ color: "#dc2626", border: "1px solid var(--border)", background: "var(--surface)" }}
          >
            Delete Forever
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
}

function ListPanelToggleButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={open ? "Collapse notes list" : "Expand notes list"}
      onClick={onToggle}
      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center"
      style={{
        borderRadius: "var(--radius-md)",
        border: "1.5px solid var(--border)",
        background: open ? "transparent" : "var(--accent-muted)",
        color: open ? "var(--text-muted)" : "var(--accent)",
        transition: "all var(--transition-base)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--accent-muted)";
        (e.currentTarget as HTMLElement).style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = open ? "transparent" : "var(--accent-muted)";
        (e.currentTarget as HTMLElement).style.color = open ? "var(--text-muted)" : "var(--accent)";
      }}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: "transform 0.25s ease",
          transform: open ? "rotate(0deg)" : "rotate(180deg)",
        }}
        aria-hidden
      >
        <path d="M10 4l-4 4 4 4" />
      </svg>
    </button>
  );
}
