"use client";

import type { NoteFolder, NotesFilter } from "@/lib/notes";

type NotesFolderSidebarProps = {
  filter: NotesFilter;
  folders: NoteFolder[];
  sharedFolderCount: number;
  privateFolderCount: number;
  onFilterChange: (filter: NotesFilter) => void;
  onCreateFolder: (name: string, visibility: "shared" | "private") => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onRenameFolder: (folderId: string, name: string) => Promise<void>;
};

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

const FOLDER_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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
  onFilterChange,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
}: NotesFolderSidebarProps) {
  const sharedFolders = folders.filter((f) => f.visibility === "shared");
  const privateFolders = folders.filter((f) => f.visibility === "private");

  async function promptNewFolder(visibility: "shared" | "private") {
    const name = window.prompt(
      visibility === "shared" ? "New shared folder name" : "New private folder name",
    );
    if (!name?.trim()) return;
    await onCreateFolder(name.trim(), visibility);
  }

  return (
    <aside
      className="flex w-52 shrink-0 flex-col overflow-y-auto border-r py-3"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <div className="space-y-0.5 px-2">
        <NavItem
          active={isFilterActive(filter, { type: "all" })}
          label="All Notes"
          icon={NOTES_ICON}
          onClick={() => onFilterChange({ type: "all" })}
        />
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
      </div>

      <div className="mt-4 px-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Shared Folders
          </p>
          <button
            type="button"
            aria-label="New shared folder"
            onClick={() => void promptNewFolder("shared")}
            className="cursor-pointer text-xs font-semibold"
            style={{ color: "var(--accent)" }}
          >
            +
          </button>
        </div>
        <div className="space-y-0.5">
          {sharedFolders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              active={filter.type === "folder" && filter.folderId === folder.id}
              onSelect={() => onFilterChange({ type: "folder", folderId: folder.id })}
              onRename={() => {
                const name = window.prompt("Rename folder", folder.name);
                if (name?.trim()) void onRenameFolder(folder.id, name.trim());
              }}
              onDelete={() => {
                if (window.confirm(`Delete folder "${folder.name}"? Notes will be moved out of the folder.`)) {
                  void onDeleteFolder(folder.id);
                }
              }}
            />
          ))}
          {sharedFolderCount === 0 && (
            <p className="px-3 py-1 text-xs" style={{ color: "var(--text-muted)" }}>
              No shared folders yet
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 px-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Private Folders
          </p>
          <button
            type="button"
            aria-label="New private folder"
            onClick={() => void promptNewFolder("private")}
            className="cursor-pointer text-xs font-semibold"
            style={{ color: "var(--accent)" }}
          >
            +
          </button>
        </div>
        <div className="space-y-0.5">
          {privateFolders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              active={filter.type === "folder" && filter.folderId === folder.id}
              onSelect={() => onFilterChange({ type: "folder", folderId: folder.id })}
              onRename={() => {
                const name = window.prompt("Rename folder", folder.name);
                if (name?.trim()) void onRenameFolder(folder.id, name.trim());
              }}
              onDelete={() => {
                if (window.confirm(`Delete folder "${folder.name}"?`)) {
                  void onDeleteFolder(folder.id);
                }
              }}
            />
          ))}
          {privateFolderCount === 0 && (
            <p className="px-3 py-1 text-xs" style={{ color: "var(--text-muted)" }}>
              No private folders yet
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

function FolderRow({
  folder,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  folder: NoteFolder;
  active: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center">
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
        {FOLDER_ICON}
        <span className="truncate">{folder.name}</span>
      </button>
      <div className="hidden gap-0.5 pr-1 group-hover:flex">
        <button type="button" onClick={onRename} className="cursor-pointer px-1 text-xs" style={{ color: "var(--text-muted)" }}>
          ✎
        </button>
        <button type="button" onClick={onDelete} className="cursor-pointer px-1 text-xs" style={{ color: "#dc2626" }}>
          ×
        </button>
      </div>
    </div>
  );
}
