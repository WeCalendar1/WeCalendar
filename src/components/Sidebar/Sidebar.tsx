"use client";

import { useState, type DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MiniCalendar } from "./MiniCalendar";
import { SharedWorkspace } from "@/components/SharedWorkspace";
import { TagCreatorInline } from "@/components/TagCreatorInline";
import { NotesDialog } from "@/components/Notes/NotesDialog";
import { FolderColorIcon, NotesFolderDialog } from "@/components/Notes/NotesFolderDialog";
import type { Tag } from "@/lib/tags";
import type { NoteFolder, NotesFilter } from "@/lib/notes";
import { NOTE_DRAG_IDS_MIME, NOTE_DRAG_MIME, NOTE_DROP_REMOVE, readNoteDragIds } from "@/lib/notes";
import type { ScreenView } from "@/lib/calendar";
import type { Tables } from "@/types/database";

type Group = Tables<"groups">;

type SidebarProps = {
  open: boolean;
  screenView: ScreenView;
  viewDate: Date;
  activeTagIds: string[];
  onTagToggle: (id: string) => void;
  tags: Tag[];
  onCreateTag: (name: string, color: string) => Promise<void>;
  onUpdateTag: (tagId: string, name: string, color: string) => Promise<void>;
  onDeleteTag: (tagId: string) => Promise<void>;
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => Promise<void>;
  onJoinGroup: (inviteCode: string) => Promise<void>;
  // Notes-specific (consumed when screenView === "notes")
  notesFilter?: NotesFilter;
  noteFolders?: NoteFolder[];
  onNotesFilterChange?: (filter: NotesFilter) => void;
  onCreateNoteFolder?: (name: string, visibility: "shared" | "private", color: string) => Promise<void>;
  onDeleteNoteFolder?: (folderId: string) => Promise<void>;
  onUpdateNoteFolder?: (folderId: string, patch: { name: string; color: string }) => Promise<void>;
  draggingNoteIds?: readonly string[];
  dragOverTarget?: string | null;
  onDragOverTarget?: (target: string | null) => void;
  onDropNoteOnFolder?: (folderId: string | null, noteIds: string[]) => void;
  onDropNoteOnTrash?: (noteIds: string[]) => void;
};

export function Sidebar({
  open,
  screenView,
  viewDate,
  activeTagIds,
  onTagToggle,
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
  notesFilter,
  noteFolders = [],
  onNotesFilterChange,
  onCreateNoteFolder,
  onDeleteNoteFolder,
  onUpdateNoteFolder,
  draggingNoteIds = [],
  dragOverTarget = null,
  onDragOverTarget,
  onDropNoteOnFolder,
  onDropNoteOnTrash,
}: SidebarProps) {
  const allOn = tags.length > 0 && activeTagIds.length === tags.length;
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [tagBusy, setTagBusy] = useState(false);

  function toggleAll() {
    if (allOn) {
      tags.forEach((t) => { if (activeTagIds.includes(t.id)) onTagToggle(t.id); });
    } else {
      tags.forEach((t) => { if (!activeTagIds.includes(t.id)) onTagToggle(t.id); });
    }
  }

  async function handleDeleteTagConfirm() {
    if (!deletingTag) return;
    setTagBusy(true);
    try {
      await onDeleteTag(deletingTag.id);
      setDeletingTag(null);
      if (editingTagId === deletingTag.id) setEditingTagId(null);
    } finally {
      setTagBusy(false);
    }
  }

  const isNotesView = screenView === "notes";
  const editingTag = tags.find((t) => t.id === editingTagId) ?? null;

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          key="sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "var(--sidebar-width)", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.35 }}
          className="shrink-0 overflow-hidden"
          aria-hidden={!open}
          style={{
            borderRight: "none",
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
            boxShadow: "inset -0.5px 0 0 var(--separator)",
          }}
          onDragLeave={isNotesView ? (event) => {
            const related = event.relatedTarget as Node | null;
            if (related && event.currentTarget.contains(related)) return;
            onDragOverTarget?.(null);
          } : undefined}
        >
          <div className="flex h-full w-[var(--sidebar-width)] flex-col gap-3 overflow-y-auto p-3">

            {/* Shared workspace — always visible */}
            <SharedWorkspace
              groups={groups}
              activeGroupId={activeGroupId}
              onSelectGroup={onSelectGroup}
              onCreateGroup={onCreateGroup}
              onJoinGroup={onJoinGroup}
            />

            {/* Mini calendar — always visible */}
            <MiniCalendar viewDate={viewDate} />

            {/* ─── Notes-specific sections ─── */}
            {isNotesView && notesFilter && onNotesFilterChange && (
              <NotesSidebarContent
                filter={notesFilter}
                folders={noteFolders}
                onFilterChange={onNotesFilterChange}
                onCreateFolder={onCreateNoteFolder}
                onDeleteFolder={onDeleteNoteFolder}
                onUpdateFolder={onUpdateNoteFolder}
                draggingNoteIds={draggingNoteIds}
                dragOverTarget={dragOverTarget}
                onDragOverTarget={onDragOverTarget}
                onDropNoteOnFolder={onDropNoteOnFolder}
                onDropNoteOnTrash={onDropNoteOnTrash}
              />
            )}

            {/* Tag filters — always visible */}
            <div
              className="flex flex-col gap-0"
              style={{
                borderRadius: "var(--radius-xl)",
                background: "var(--surface)",
                boxShadow: "inset 0 0 0 0.5px var(--hairline), var(--shadow-sm)",
              }}
            >
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                aria-controls="sidebar-filters-body"
                className="pressable flex w-full items-center justify-between px-3 py-2.5"
                style={{ background: "transparent", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0" }}
              >
                <p className="text-label" style={{ color: "var(--text-muted)" }}>
                  Filters
                </p>
                <div className="flex items-center gap-2">
                  {filtersOpen && tags.length > 0 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); toggleAll(); } }}
                      className="pressable text-xs font-semibold"
                      style={{ color: "var(--accent)", letterSpacing: "-0.004em" }}
                    >
                      {allOn ? "Clear all" : "Select all"}
                    </span>
                  )}
                  <motion.svg
                    animate={{ rotate: filtersOpen ? 0 : -90 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.25 }}
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: "var(--text-muted)" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M4 6l4 4 4-4" />
                  </motion.svg>
                </div>
              </button>

              {/* Animated collapsible body */}
              <motion.div
                id="sidebar-filters-body"
                initial={false}
                animate={{ height: filtersOpen ? "auto" : 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                style={{ overflow: "hidden" }}
              >
                <div className="flex flex-col gap-0.5 px-2 pb-2">
                  {tags.length === 0 && (
                    <p className="px-2 py-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      No tags yet — create one below.
                    </p>
                  )}

                  {tags.map((tag) => {
                    if (editingTag?.id === tag.id) {
                      return (
                        <TagCreatorInline
                          key={tag.id}
                          initial={{ name: tag.name, color: tag.color }}
                          submitLabel="Save"
                          onCancel={() => setEditingTagId(null)}
                          onAdd={async (name, color) => {
                            await onUpdateTag(tag.id, name, color);
                            setEditingTagId(null);
                          }}
                        />
                      );
                    }

                    const active = activeTagIds.includes(tag.id);
                    return (
                      <div key={tag.id} className="group flex items-center gap-0.5">
                        <label
                          htmlFor={`tag-${tag.id}`}
                          className="pressable flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm"
                          style={{
                            background: active ? `color-mix(in srgb, ${tag.color} 12%, transparent)` : "transparent",
                            letterSpacing: "-0.004em",
                          }}
                        >
                          <span
                            className="relative flex h-4 w-4 shrink-0 items-center justify-center"
                            style={{
                              borderRadius: "var(--radius-xs)",
                              border: active ? "none" : `1.5px solid ${tag.color}`,
                              background: active ? tag.color : "transparent",
                            }}
                          >
                            {active && (
                              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 6l3 3 5-5" />
                              </svg>
                            )}
                          </span>
                          <input id={`tag-${tag.id}`} type="checkbox" checked={active} onChange={() => onTagToggle(tag.id)} className="sr-only" />
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tag.color }} />
                          <span className="truncate" style={{ color: "var(--foreground)", fontWeight: 500 }}>{tag.name}</span>
                        </label>
                        <div className="hidden shrink-0 gap-0.5 pr-0.5 group-hover:flex">
                          <button
                            type="button"
                            aria-label={`Edit ${tag.name}`}
                            onClick={() => setEditingTagId(tag.id)}
                            className="cursor-pointer px-1 text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${tag.name}`}
                            onClick={() => setDeletingTag(tag)}
                            className="cursor-pointer px-1 text-xs"
                            style={{ color: "#dc2626" }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {activeGroupId && !editingTagId && (
                    <div className="mt-1">
                      <TagCreatorInline onAdd={onCreateTag} />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

          </div>

          <NotesDialog
            open={Boolean(deletingTag)}
            busy={tagBusy}
            mode="confirm"
            danger
            title={deletingTag ? `Delete "${deletingTag.name}"?` : "Delete tag?"}
            description="This removes the tag from all events. Events themselves are kept."
            confirmLabel="Delete tag"
            onClose={() => setDeletingTag(null)}
            onConfirm={handleDeleteTagConfirm}
          />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Notes-specific sidebar content (absorbed from NotesFolderSidebar)
   ═══════════════════════════════════════════════════════════════════════════ */

type FolderDialogState =
  | { type: "create"; visibility: "shared" | "private" }
  | { type: "edit"; folderId: string; folderName: string; color: string; visibility: "shared" | "private" }
  | { type: "delete"; folderId: string; folderName: string; visibility: "shared" | "private" }
  | null;

function NotesSidebarContent({
  filter,
  folders,
  onFilterChange,
  onCreateFolder,
  onDeleteFolder,
  onUpdateFolder,
  draggingNoteIds = [],
  dragOverTarget = null,
  onDragOverTarget,
  onDropNoteOnFolder,
  onDropNoteOnTrash,
}: {
  filter: NotesFilter;
  folders: NoteFolder[];
  onFilterChange: (filter: NotesFilter) => void;
  onCreateFolder?: (name: string, visibility: "shared" | "private", color: string) => Promise<void>;
  onDeleteFolder?: (folderId: string) => Promise<void>;
  onUpdateFolder?: (folderId: string, patch: { name: string; color: string }) => Promise<void>;
  draggingNoteIds?: readonly string[];
  dragOverTarget?: string | null;
  onDragOverTarget?: (target: string | null) => void;
  onDropNoteOnFolder?: (folderId: string | null, noteIds: string[]) => void;
  onDropNoteOnTrash?: (noteIds: string[]) => void;
}) {
  const [dialog, setDialog] = useState<FolderDialogState>(null);
  const [busy, setBusy] = useState(false);
  const [sharedFoldersOpen, setSharedFoldersOpen] = useState(true);
  const [privateFoldersOpen, setPrivateFoldersOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(true);
  const isDragging = draggingNoteIds.length > 0;

  const sharedFolders = folders.filter((f) => f.visibility === "shared");
  const privateFolders = folders.filter((f) => f.visibility === "private");

  function readDraggedNoteIds(event: DragEvent): string[] {
    return readNoteDragIds(event.dataTransfer, draggingNoteIds);
  }

  function acceptsNoteDrag(event: DragEvent): boolean {
    return (
      isDragging ||
      event.dataTransfer.types.includes(NOTE_DRAG_MIME) ||
      event.dataTransfer.types.includes(NOTE_DRAG_IDS_MIME)
    );
  }

  function handleFolderDragOver(event: DragEvent, target: string) {
    if (!acceptsNoteDrag(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    onDragOverTarget?.(target);
  }

  function handleFolderDrop(event: DragEvent, folderId: string | null) {
    event.preventDefault();
    const noteIds = readDraggedNoteIds(event);
    if (noteIds.length === 0) return;
    onDropNoteOnFolder?.(folderId, noteIds);
    onDragOverTarget?.(null);
  }

  function handleTrashDrop(event: DragEvent) {
    event.preventDefault();
    const noteIds = readDraggedNoteIds(event);
    if (noteIds.length === 0) return;
    onDropNoteOnTrash?.(noteIds);
    onDragOverTarget?.(null);
  }

  async function handleFolderFormConfirm(name: string, color: string) {
    if (!dialog) return;
    setBusy(true);
    try {
      if (dialog.type === "create") {
        await onCreateFolder?.(name, dialog.visibility, color);
      } else if (dialog.type === "edit") {
        await onUpdateFolder?.(dialog.folderId, { name, color });
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
      await onDeleteFolder?.(dialog.folderId);
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
      {/* Note view filters and folders */}
      <div
        className="flex flex-col gap-0"
        style={{
          borderRadius: "var(--radius-xl)",
          background: "var(--surface)",
          boxShadow: "inset 0 0 0 0.5px var(--hairline), var(--shadow-sm)",
        }}
        onDragEnter={() => {
          if (isDragging) setNotesOpen(true);
        }}
      >
        {/* Header - click to collapse/expand Notes */}
        <button
          type="button"
          onClick={() => setNotesOpen((v) => !v)}
          aria-expanded={notesOpen}
          aria-controls="sidebar-notes-body"
          className="pressable flex w-full items-center justify-between px-3 py-2.5"
          style={{
            background: "transparent",
            borderRadius: notesOpen ? "var(--radius-xl) var(--radius-xl) 0 0" : "var(--radius-xl)",
          }}
        >
          <p className="text-label" style={{ color: "var(--text-muted)" }}>
            Notes
          </p>
          <motion.svg
            animate={{ rotate: notesOpen ? 0 : -90 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: "var(--text-muted)" }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M4 6l4 4 4-4" />
          </motion.svg>
        </button>

        {/* Animated collapsible body */}
        <motion.div
          id="sidebar-notes-body"
          initial={false}
          animate={{ height: notesOpen ? "auto" : 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          style={{ overflow: "hidden" }}
        >
          <div className="space-y-0.5 px-2 pb-2">
            <div
              onDragOver={(e) => handleFolderDragOver(e, NOTE_DROP_REMOVE)}
              onDrop={(e) => handleFolderDrop(e, null)}
              style={dropTargetStyle(dragOverTarget === NOTE_DROP_REMOVE)}
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
            onDrop={handleTrashDrop}
            style={dropTargetStyle(dragOverTarget === "__trash__")}
          >
            <NavItem
              active={isFilterActive(filter, { type: "trash" })}
              label="Trash"
              icon={TRASH_ICON}
              onClick={() => onFilterChange({ type: "trash" })}
            />
          </div>
        </div>

        {/* Shared folders */}
        <FolderSection
          title="Shared Folders"
          count={sharedFolders.length}
          open={sharedFoldersOpen}
          onToggle={() => setSharedFoldersOpen((v) => !v)}
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
              onDrop={(e) => handleFolderDrop(e, folder.id)}
            />
          ))}
        </FolderSection>

        {/* Private folders */}
        <FolderSection
          title="Private Folders"
          count={privateFolders.length}
          open={privateFoldersOpen}
          onToggle={() => setPrivateFoldersOpen((v) => !v)}
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
              onDrop={(e) => handleFolderDrop(e, folder.id)}
            />
          ))}
        </FolderSection>
        </motion.div>
      </div>

      {/* Folder dialogs */}
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

/* ─── Shared sub-components ─────────────────────────────────────────── */

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

function dropTargetStyle(active: boolean): React.CSSProperties {
  return {
    borderRadius: "var(--radius-md)",
    border: active ? "2px dashed var(--accent)" : "2px solid transparent",
    background: active ? "var(--accent-muted)" : "transparent",
    transition: "background 120ms ease-out, border-color 120ms ease-out",
  };
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
    <div className="px-1 pt-2" onDragEnter={isDragging && !open ? onDragEnter : undefined}>
      <div className="mb-1 flex items-center gap-1 px-2">
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
          <div className="space-y-0.5 p-0.5">
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

function FolderRow({
  folder,
  active,
  dragOver,
  onSelect,
  onEdit,
  onDelete,
  onDragOver,
  onDrop,
}: {
  folder: NoteFolder;
  active: boolean;
  dragOver: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragOver: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
}) {
  return (
    <div
      className="group flex items-center"
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={dropTargetStyle(dragOver)}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-sm"
        style={{
          borderRadius: "calc(var(--radius-md) - 2px)",
          background: active && !dragOver ? "var(--accent-muted)" : "transparent",
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

function isFilterActive(a: NotesFilter, b: NotesFilter): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "folder" && b.type === "folder") return a.folderId === b.folderId;
  return true;
}

/* ─── SVG icons ─── */

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

const TRASH_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
