"use client";

import {
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Tables } from "@/types/database";

export type ListCategory = Tables<"lists">["category"];
export type SharedList = Tables<"lists">;
export type ListItem = Tables<"list_items">;

const CATEGORIES: { id: ListCategory; label: string }[] = [
  { id: "todo", label: "To-do" },
  { id: "grocery", label: "Grocery" },
  { id: "wishlist", label: "Wishlist" },
  { id: "custom", label: "Custom" },
];

function categoryLabel(category: ListCategory): string {
  return CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

type TaskPanelProps = {
  groupId: string | null;
  lists: SharedList[];
  items: ListItem[];
  onCreateList: (name: string, category: ListCategory) => Promise<void>;
  onRenameList: (listId: string, name: string) => Promise<void>;
  onDeleteList: (listId: string) => Promise<void>;
  onAddItem: (listId: string, content: string) => Promise<void>;
  onToggleItem: (itemId: string, isChecked: boolean) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onReorderItems: (listId: string, orderedItemIds: string[]) => Promise<void>;
};

export function TaskPanel({
  groupId,
  lists,
  items,
  onCreateList,
  onRenameList,
  onDeleteList,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onReorderItems,
}: TaskPanelProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ListCategory>("todo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateList(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onCreateList(name.trim(), category);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create list.");
    } finally {
      setBusy(false);
    }
  }

  if (!groupId) {
    return (
      <div
        className="flex flex-1 items-center justify-center p-4 text-center text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        Join or create a shared workspace to use collaborative lists.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <form
        onSubmit={(e) => void handleCreateList(e)}
        className="space-y-2 border-b px-4 py-3"
        style={{ borderColor: "var(--border)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          New list
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Groceries"
          className="w-full px-3 py-2 text-sm outline-none"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1.5px solid var(--border)",
            background: "var(--surface)",
          }}
        />
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ListCategory)}
            className="flex-1 px-2 py-2 text-sm outline-none"
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="btn-bounce shrink-0 cursor-pointer px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            style={{
              borderRadius: "var(--radius-lg)",
              background: "var(--accent)",
            }}
          >
            Add
          </button>
        </div>
        {error && (
          <p className="text-xs" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}
      </form>

      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
        {lists.length === 0 ? (
          <p
            className="px-1 py-6 text-center text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            No lists yet. Add a to-do, grocery list, or wishlist to sync with your
            workspace.
          </p>
        ) : (
          lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              items={items
                .filter((item) => item.list_id === list.id)
                .sort(
                  (a, b) =>
                    a.sort_order - b.sort_order ||
                    a.created_at.localeCompare(b.created_at),
                )}
              onRenameList={onRenameList}
              onDeleteList={onDeleteList}
              onAddItem={onAddItem}
              onToggleItem={onToggleItem}
              onDeleteItem={onDeleteItem}
              onReorderItems={onReorderItems}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ListCard({
  list,
  items,
  onRenameList,
  onDeleteList,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onReorderItems,
}: {
  list: SharedList;
  items: ListItem[];
  onRenameList: (listId: string, name: string) => Promise<void>;
  onDeleteList: (listId: string) => Promise<void>;
  onAddItem: (listId: string, content: string) => Promise<void>;
  onToggleItem: (itemId: string, isChecked: boolean) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onReorderItems: (listId: string, orderedItemIds: string[]) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState(list.name);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRenameDraft(list.name);
  }, [list.name]);

  useEffect(() => {
    if (renaming) renameInputRef.current?.select();
  }, [renaming]);

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = window.setTimeout(() => setConfirmDelete(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await onAddItem(list.id, draft.trim());
      setDraft("");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    try {
      await onDeleteList(list.id);
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  async function commitRename() {
    const next = renameDraft.trim();
    if (!next || next === list.name) {
      setRenameDraft(list.name);
      setRenaming(false);
      return;
    }
    setBusy(true);
    try {
      await onRenameList(list.id, next);
      setRenaming(false);
    } catch {
      setRenameDraft(list.name);
    } finally {
      setBusy(false);
    }
  }

  function handleRenameKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void commitRename();
    }
    if (event.key === "Escape") {
      setRenameDraft(list.name);
      setRenaming(false);
    }
  }

  function handleDragStart(event: DragEvent<HTMLLIElement>, itemId: string) {
    event.dataTransfer.setData("text/plain", itemId);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>, itemId: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverId !== itemId) setDragOverId(itemId);
  }

  async function handleDrop(event: DragEvent<HTMLLIElement>, targetId: string) {
    event.preventDefault();
    setDragOverId(null);
    const sourceId = event.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) return;

    const ids = items.map((item) => item.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, sourceId);
    await onReorderItems(list.id, next);
  }

  const remaining = items.filter((item) => !item.is_checked).length;

  return (
    <section
      className="p-3"
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1.5px solid var(--border)",
        background: "var(--surface-2)",
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              ref={renameInputRef}
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onBlur={() => void commitRename()}
              onKeyDown={handleRenameKey}
              disabled={busy}
              className="w-full px-2 py-1 text-sm font-semibold outline-none"
              style={{
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--accent)",
                background: "var(--surface)",
                color: "var(--foreground)",
              }}
              aria-label="Rename list"
            />
          ) : (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="block max-w-full cursor-pointer truncate text-left text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
              title="Click to rename"
            >
              {list.name}
            </button>
          )}
          <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            {categoryLabel(list.category)} · {remaining} left
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!renaming && (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="cursor-pointer text-[11px] font-semibold"
              style={{ color: "var(--accent)" }}
            >
              Rename
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={busy}
            className="cursor-pointer text-[11px] font-semibold disabled:opacity-50"
            style={{
              color: confirmDelete ? "#fff" : "#dc2626",
              background: confirmDelete ? "#dc2626" : "transparent",
              borderRadius: "var(--radius-md)",
              padding: confirmDelete ? "2px 6px" : 0,
            }}
          >
            {confirmDelete ? "Confirm?" : "Delete"}
          </button>
        </div>
      </div>

      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={() => {
              if (dragOverId === item.id) setDragOverId(null);
            }}
            onDrop={(e) => void handleDrop(e, item.id)}
            onDragEnd={() => setDragOverId(null)}
            className="flex items-center gap-1.5 rounded-md px-1 py-0.5"
            style={{
              background:
                dragOverId === item.id ? "var(--accent-muted)" : "transparent",
              outline:
                dragOverId === item.id
                  ? "1.5px dashed var(--accent)"
                  : "1.5px solid transparent",
            }}
          >
            <span
              aria-hidden
              className="cursor-grab select-none px-0.5 text-xs active:cursor-grabbing"
              style={{ color: "var(--text-muted)" }}
              title="Drag to reorder"
            >
              ⋮⋮
            </span>
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={item.is_checked}
                onChange={() => void onToggleItem(item.id, !item.is_checked)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--accent)]"
              />
              <span
                className="truncate text-sm"
                style={{
                  color: item.is_checked ? "var(--text-muted)" : "var(--foreground)",
                  textDecoration: item.is_checked ? "line-through" : "none",
                }}
              >
                {item.content}
              </span>
            </label>
            <button
              type="button"
              onClick={() => void onDeleteItem(item.id)}
              aria-label={`Remove ${item.content}`}
              className="cursor-pointer text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={(e) => void handleAdd(e)} className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add item"
          className="min-w-0 flex-1 px-2.5 py-1.5 text-sm outline-none"
          style={{
            borderRadius: "var(--radius-md)",
            border: "1.5px solid var(--border)",
            background: "var(--surface)",
          }}
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="cursor-pointer px-2 text-sm font-semibold disabled:opacity-40"
          style={{ color: "var(--accent)" }}
        >
          Add
        </button>
      </form>
    </section>
  );
}
