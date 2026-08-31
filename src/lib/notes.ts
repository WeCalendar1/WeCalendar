import type { Json, Tables } from "@/types/database";

export type NoteFolder = Tables<"note_folders">;
export type Note = Tables<"notes">;
export type NoteVisibility = Note["visibility"];

export type NotesFilter =
  | { type: "all" }
  | { type: "pinned" }
  | { type: "recent" }
  | { type: "shared" }
  | { type: "private" }
  | { type: "folder"; folderId: string }
  | { type: "event"; eventId: string }
  | { type: "date"; date: string };

export const EMPTY_TIPTAP_DOC: Json = { type: "doc", content: [] };

export function noteTitle(note: Pick<Note, "title" | "content">): string {
  const trimmed = note.title.trim();
  if (trimmed) return trimmed;
  const preview = notePreviewText(note.content);
  if (preview) return preview.slice(0, 60);
  return "New Note";
}

export function notePreviewText(content: Json): string {
  if (!content || typeof content !== "object" || Array.isArray(content)) return "";
  const doc = content as { type?: string; content?: unknown[] };
  if (doc.type !== "doc" || !Array.isArray(doc.content)) return "";
  const parts: string[] = [];
  walkNodes(doc.content, parts);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function walkNodes(nodes: unknown[], parts: string[]): void {
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === "text" && typeof n.text === "string") {
      parts.push(n.text);
    }
    if (Array.isArray(n.content)) {
      walkNodes(n.content, parts);
    }
  }
}

export function formatNoteDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function notePatchBumpsUpdatedAt(
  patch: Partial<Pick<Note, "title" | "content" | "folder_id" | "event_id" | "linked_date" | "visibility" | "is_pinned">>,
): boolean {
  return patch.title !== undefined || patch.content !== undefined;
}

export function sortNotesForList(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export function filterNotes(notes: Note[], filter: NotesFilter): Note[] {
  switch (filter.type) {
    case "all":
      return notes;
    case "pinned":
      return notes.filter((n) => n.is_pinned);
    case "recent": {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return notes.filter((n) => new Date(n.updated_at).getTime() >= weekAgo);
    }
    case "shared":
      return notes.filter((n) => n.visibility === "shared");
    case "private":
      return notes.filter((n) => n.visibility === "private");
    case "folder":
      return notes.filter((n) => n.folder_id === filter.folderId);
    case "event":
      return notes.filter((n) => n.event_id === filter.eventId);
    case "date":
      return notes.filter((n) => n.linked_date === filter.date);
    default:
      return notes;
  }
}

export function searchNotes(notes: Note[], query: string): Note[] {
  const q = query.trim().toLowerCase();
  if (!q) return notes;
  return notes.filter((note) => {
    const title = note.title.toLowerCase();
    const preview = notePreviewText(note.content).toLowerCase();
    return title.includes(q) || preview.includes(q);
  });
}

export const NOTE_DRAG_MIME = "application/x-wecalendar-note-id";
export const NOTE_DROP_REMOVE = "__remove__";

export function foldersForNote(
  note: Pick<Note, "visibility">,
  folders: NoteFolder[],
): NoteFolder[] {
  return folders.filter((folder) => folder.visibility === note.visibility);
}

export function folderNameForNote(
  note: Pick<Note, "folder_id">,
  folders: NoteFolder[],
): string | null {
  if (!note.folder_id) return null;
  return folders.find((folder) => folder.id === note.folder_id)?.name ?? null;
}

export function canMoveNoteToFolder(
  note: Pick<Note, "visibility">,
  folder: NoteFolder,
): boolean {
  return note.visibility === folder.visibility;
}

export function filterLabel(filter: NotesFilter, folders: NoteFolder[]): string {
  switch (filter.type) {
    case "all":
      return "All Notes";
    case "pinned":
      return "Pinned";
    case "recent":
      return "Recent";
    case "shared":
      return "Shared";
    case "private":
      return "Private";
    case "folder": {
      const folder = folders.find((f) => f.id === filter.folderId);
      return folder?.name ?? "Folder";
    }
    case "event":
      return "Event Notes";
    case "date":
      return new Date(filter.date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    default:
      return "Notes";
  }
}
