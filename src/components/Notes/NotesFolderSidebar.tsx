"use client";

import { useState, type DragEvent } from "react";
import { SharedWorkspace } from "@/components/SharedWorkspace";
import type { NoteFolder, NotesFilter } from "@/lib/notes";
import { NOTE_DRAG_MIME, NOTE_DROP_REMOVE } from "@/lib/notes";
import type { Tables } from "@/types/database";
import { NotesDialog } from "./NotesDialog";
import { FolderColorIcon, NotesFolderDialog } from "./NotesFolderDialog";

type Group = Tables<"groups">;

type NotesFolderSidebarProps = {
  filter: NotesFilter;
  folders: NoteFolder[];
  sharedFolderCount: number;
  privateFolderCount: number;
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => Promise<void>;
  onJoinGroup: (inviteCode: string) => Promise<void>;
  onFilterChange: (filter: NotesFilter) => void;
  onCreateFolder: (name: string, visibility: "shared" | "private", color: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onUpdateFolder: (folderId: string, patch: { name: string; color: string }) => Promise<void>;
  draggingNoteId: string | null;
  dragOverTarget: string | null;
  onDragOverTarget: (target: string | null) => void;
  onDropNoteOnFolder: (folderId: string | null) => void;
  onDropNoteOnTrash: () => void;
};

type FolderDialogState =
  | { type: "create"; visibility: "shared" | "private" }
  | { type: "edit"; folderId: string; folderName: string; color: string; visibility: "shared" | "private" }
  | { type: "delete"; folderId: string; folderName: string; visibility: "shared" | "private" }
  | null;

function NavItem({
  active,
  label,
  count,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm font-medium"
      style={{
        borderRadius: "var(--radius-md)",
        background: active ? "var(--accent-muted)" : "transparent",
        color: active ? "var(--accent)" : "var(--foreground)",
        transition: "background var(--transition-fast)",
      }}
    >
      <span className="shrink-0 opacity-80">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {count}
        </span>
      )}
    </button>
  );
}

const PIN_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M12 17v5M9 3h6l1 7h4l-5 9v-4H9v4L4 10h4L9 3z" />
  </svg>
);

const CLOCK_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const NOTES_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

const LOCK_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const PEOPLE_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0"
      style={{
        transform: open ? "rotate(0deg)" : "rotate(-90deg)",
        color: "var(--text-muted)",
        transition: "transform 120ms ease-out",
      }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function FolderSection({
  title,
  count,
  open,
  onToggle,
  onCreate,
  createLabel,
  emptyMessage,
  isDragging,
  onDragEnter,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  onCreate: () => void;
  createLabel: string;
  emptyMessage: string;
  isDragging: boolean;
  onDragEnter: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 px-3" onDragEnter={isDragging && !open ? onDragEnter : undefined}>
      <div className="mb-1 flex items-center gap-1">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 py-0.5 text-left"
        >
          <ChevronIcon open={open} />
          <span
            className="truncate text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            {title}
          </span>
          {count > 0 && (
            <span className="shrink-0 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
              ({count})
            </span>
          )}
        </button>
        <button
          type="button"
          aria-label={createLabel}
          onClick={onCreate}
          className="shrink-0 cursor-pointer px-1 text-xs font-semibold"
          style={{ color: "var(--accent)" }}
        >
          +
        </button>
      </div>
      <div
        className="grid"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 140ms cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-0.5">
            {children}
            {count === 0 && (
              <p className="px-1 py-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {emptyMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function isFilterActive(a: NotesFilter, b: NotesFilter): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "folder" && b.type === "folder") return a.folderId === b.folderId;
  return true;
}

export function NotesFolderSidebar({
  filter,
  folders,
  sharedFolderCount,
  privateFolderCount,
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
  onFilterChange,
  onCreateFolder,
  onDeleteFolder,
  onUpdateFolder,
  draggingNoteId,
  dragOverTarget,
  onDragOverTarget,
  onDropNoteOnFolder,
  onDropNoteOnTrash,
}: NotesFolderSidebarProps) {
  const [dialog, setDialog] = useState<FolderDialogState>(null);
  const [busy, setBusy] = useState(false);
  const [sharedFoldersOpen, setSharedFoldersOpen] = useState(true);
  const [privateFoldersOpen, setPrivateFoldersOpen] = useState(true);
  const isDragging = draggingNoteId !== null;

  function readDraggedNoteId(event: DragEvent): string | null {
    return event.dataTransfer.getData(NOTE_DRAG_MIME) || draggingNoteId;
  }

  function handleFolderDragOver(event: DragEvent, target: string) {
    if (!isDragging && !event.dataTransfer.types.includes(NOTE_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    onDragOverTarget(target);
  }

  function handleFolderDrop(event: DragEvent, folderId: string | null) {
    event.preventDefault();
    if (!readDraggedNoteId(event)) return;
    onDropNoteOnFolder(folderId);
    onDragOverTarget(null);
  }

  function handleTrashDrop(event: DragEvent) {
    event.preventDefault();
    if (!readDraggedNoteId(event)) return;
    onDropNoteOnTrash();
    onDragOverTarget(null);
  }

  const sharedFolders = folders.filter((f) => f.visibility === "shared");
  const privateFolders = folders.filter((f) => f.visibility === "private");

  async function handleFolderFormConfirm(name: string, color: string) {
    if (!dialog) return;
    setBusy(true);
    try {
      if (dialog.type === "create") {
        await onCreateFolder(name, dialog.visibility, color);
      } else if (dialog.type === "edit") {
        await onUpdateFolder(dialog.folderId, { name, color });
      }
      setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!dialog || dialog.type !== "delete") return;
    setBusy(true);
    try {
      await onDeleteFolder(dialog.folderId);
      setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  const folderFormDialog =
    dialog?.type === "create"
      ? {
          mode: "create" as const,
          title: dialog.visibility === "shared" ? "New shared folder" : "New private folder",
          description:
            dialog.visibility === "shared"
              ? "Everyone in this workspace can see notes in shared folders."
              : "Only you can see notes in private folders.",
          confirmLabel: "Create",
        }
      : dialog?.type === "edit"
        ? {
            mode: "edit" as const,
            title: "Edit folder",
            defaultName: dialog.folderName,
            defaultColor: dialog.color,
            confirmLabel: "Save",
          }
        : null;

  const deleteDialogProps =
    dialog?.type === "delete"
      ? {
          title: `Delete "${dialog.folderName}"?`,
          description:
            dialog.visibility === "shared"
              ? "Notes in this folder will stay in your workspace but won't belong to a folder anymore."
              : "Notes in this folder will stay in your private notes but won't belong to a folder anymore.",
          mode: "confirm" as const,
          danger: true,
          confirmLabel: "Delete folder",
        }
      : null;

  return (
    <>
      <aside
        className="flex w-64 shrink-0 flex-col overflow-y-auto border-r py-3"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <div className="mb-3 px-2">
          <SharedWorkspace
            groups={groups}
            activeGroupId={activeGroupId}
            onSelectGroup={onSelectGroup}
            onCreateGroup={onCreateGroup}
            onJoinGroup={onJoinGroup}
          />
        </div>

        <div className="space-y-0.5 px-2">
          <div
            onDragOver={(e) => handleFolderDragOver(e, NOTE_DROP_REMOVE)}
            onDragLeave={() => onDragOverTarget(null)}
            onDrop={(e) => handleFolderDrop(e, null)}
            className="rounded-lg"
            style={{
              background: dragOverTarget === NOTE_DROP_REMOVE ? "var(--accent-muted)" : "transparent",
              transition: "background 120ms ease-out",
            }}
          >
            <NavItem
              active={isFilterActive(filter, { type: "all" })}
              label="All Notes"
              icon={NOTES_ICON}
              onClick={() => onFilterChange({ type: "all" })}
            />
          </div>
          <NavItem
            active={isFilterActive(filter, { type: "pinned" })}
            label="Pinned"
            icon={PIN_ICON}
            onClick={() => onFilterChange({ type: "pinned" })}
          />
          <NavItem
            active={isFilterActive(filter, { type: "recent" })}
            label="Recent"
            icon={CLOCK_ICON}
            onClick={() => onFilterChange({ type: "recent" })}
          />
          <NavItem
            active={isFilterActive(filter, { type: "shared" })}
            label="Shared"
            icon={PEOPLE_ICON}
            onClick={() => onFilterChange({ type: "shared" })}
          />
          <NavItem
            active={isFilterActive(filter, { type: "private" })}
            label="Private"
            icon={LOCK_ICON}
            onClick={() => onFilterChange({ type: "private" })}
          />
          <div
            onDragOver={(e) => handleFolderDragOver(e, "__trash__")}
            onDragLeave={() => onDragOverTarget(null)}
            onDrop={handleTrashDrop}
            className="rounded-lg"
            style={{
              background: dragOverTarget === "__trash__" ? "var(--accent-muted)" : "transparent",
              transition: "background 120ms ease-out",
            }}
          >
            <NavItem
              active={isFilterActive(filter, { type: "trash" })}
              label="Trash"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              }
              onClick={() => onFilterChange({ type: "trash" })}
            />
          </div>
        </div>



        <FolderSection
          title="Shared Folders"
          count={sharedFolderCount}
          open={sharedFoldersOpen}
          onToggle={() => setSharedFoldersOpen((open) => !open)}
          onCreate={() => setDialog({ type: "create", visibility: "shared" })}
          createLabel="New shared folder"
          emptyMessage="Organize shared notes into folders. Drag notes here after creating one."
          isDragging={isDragging}
          onDragEnter={() => setSharedFoldersOpen(true)}
        >
          {sharedFolders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              active={filter.type === "folder" && filter.folderId === folder.id}
              dragOver={dragOverTarget === folder.id}
              onSelect={() => onFilterChange({ type: "folder", folderId: folder.id })}
              onEdit={() =>
                setDialog({
                  type: "edit",
                  folderId: folder.id,
                  folderName: folder.name,
                  color: folder.color,
                  visibility: "shared",
                })
              }
              onDelete={() =>
                setDialog({
                  type: "delete",
                  folderId: folder.id,
                  folderName: folder.name,
                  visibility: "shared",
                })
              }
              onDragOver={(e) => handleFolderDragOver(e, folder.id)}
              onDragLeave={() => onDragOverTarget(null)}
              onDrop={(e) => handleFolderDrop(e, folder.id)}
            />
          ))}
        </FolderSection>

        <FolderSection
          title="Private Folders"
          count={privateFolderCount}
          open={privateFoldersOpen}
          onToggle={() => setPrivateFoldersOpen((open) => !open)}
          onCreate={() => setDialog({ type: "create", visibility: "private" })}
          createLabel="New private folder"
          emptyMessage="Only you can see private folders and the notes inside them."
          isDragging={isDragging}
          onDragEnter={() => setPrivateFoldersOpen(true)}
        >
          {privateFolders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              active={filter.type === "folder" && filter.folderId === folder.id}
              dragOver={dragOverTarget === folder.id}
              onSelect={() => onFilterChange({ type: "folder", folderId: folder.id })}
              onEdit={() =>
                setDialog({
                  type: "edit",
                  folderId: folder.id,
                  folderName: folder.name,
                  color: folder.color,
                  visibility: "private",
                })
              }
              onDelete={() =>
                setDialog({
                  type: "delete",
                  folderId: folder.id,
                  folderName: folder.name,
                  visibility: "private",
                })
              }
              onDragOver={(e) => handleFolderDragOver(e, folder.id)}
              onDragLeave={() => onDragOverTarget(null)}
              onDrop={(e) => handleFolderDrop(e, folder.id)}
            />
          ))}
        </FolderSection>
      </aside>

      {folderFormDialog && (
        <NotesFolderDialog
          open
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={handleFolderFormConfirm}
          {...folderFormDialog}
        />
      )}

      {deleteDialogProps && (
        <NotesDialog
          open
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={handleDeleteConfirm}
          {...deleteDialogProps}
        />
      )}
    </>
  );
}

function FolderRow({
  folder,
  active,
  dragOver,
  onSelect,
  onEdit,
  onDelete,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  folder: NoteFolder;
  active: boolean;
  dragOver: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent) => void;
}) {
  return (
    <div
      className="group flex items-center"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        borderRadius: "var(--radius-md)",
        outline: dragOver ? "2px dashed var(--accent)" : "2px dashed transparent",
        background: dragOver ? "var(--accent-muted)" : undefined,
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm"
        style={{
          borderRadius: "var(--radius-md)",
          background: active ? "var(--accent-muted)" : "transparent",
          color: active ? "var(--accent)" : "var(--foreground)",
        }}
      >
        <FolderColorIcon color={folder.color} />
        <span className="truncate">{folder.name}</span>
      </button>
      <div className="hidden gap-0.5 pr-1 group-hover:flex">
        <button type="button" onClick={onEdit} className="cursor-pointer px-1 text-xs" style={{ color: "var(--text-muted)" }}>
          ✎
        </button>
        <button type="button" onClick={onDelete} className="cursor-pointer px-1 text-xs" style={{ color: "#dc2626" }}>
          ×
        </button>
      </div>
    </div>
  );
}
