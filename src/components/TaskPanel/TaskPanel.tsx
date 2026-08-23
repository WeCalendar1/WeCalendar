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

type CategoryStyle = {
  id: ListCategory;
  label: string;
  accent: string;
  background: string;
  border: string;
  badgeText: string;
};

const CATEGORIES: CategoryStyle[] = [
  {
    id: "todo",
    label: "To-do",
    accent: "#0284c7",
    background: "#e0f2fe",
    border: "#7dd3fc",
    badgeText: "#075985",
  },
  {
    id: "grocery",
    label: "Grocery",
    accent: "#059669",
    background: "#d1fae5",
    border: "#6ee7b7",
    badgeText: "#065f46",
  },
  {
    id: "wishlist",
    label: "Wishlist",
    accent: "#e11d48",
    background: "#ffe4e6",
    border: "#fda4af",
    badgeText: "#9f1239",
  },
  {
    id: "custom",
    label: "Custom",
    accent: "#475569",
    background: "#f1f5f9",
    border: "#cbd5e1",
    badgeText: "#334155",
  },
];

function categoryStyle(category: ListCategory): CategoryStyle {
  return CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[3]!;
}

function categoryLabel(category: ListCategory): string {
  return categoryStyle(category).label;
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
              border: `1.5px solid ${categoryStyle(category).border}`,
              background: categoryStyle(category).background,
              color: categoryStyle(category).badgeText,
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
              background: categoryStyle(category).accent,
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
  const style = categoryStyle(list.category);

  return (
    <section
      className="p-3"
      style={{
        borderRadius: "var(--radius-xl)",
        border: `1.5px solid ${style.border}`,
        borderLeft: `2px solid ${style.accent}`,
        background: style.background,
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
                border: `1.5px solid ${style.accent}`,
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
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{
                borderRadius: "var(--radius-full)",
                background: "var(--surface)",
                color: style.badgeText,
                border: `1px solid ${style.border}`,
              }}
            >
              {categoryLabel(list.category)}
            </span>
            <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
              {remaining} left
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!renaming && (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="cursor-pointer text-[11px] font-semibold"
              style={{ color: style.accent }}
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
              background: dragOverId === item.id ? "var(--surface)" : "transparent",
              outline:
                dragOverId === item.id
                  ? `1.5px dashed ${style.accent}`
                  : "1.5px solid transparent",
            }}
          >
            <span
              aria-hidden
              className="cursor-grab select-none px-0.5 text-xs active:cursor-grabbing"
              style={{ color: style.accent }}
              title="Drag to reorder"
            >
              ⋮⋮
            </span>
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={item.is_checked}
                onChange={() => void onToggleItem(item.id, !item.is_checked)}
                className="h-4 w-4 shrink-0 cursor-pointer"
                style={{ accentColor: style.accent }}
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
            border: `1.5px solid ${style.border}`,
            background: "var(--surface)",
          }}
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="cursor-pointer px-2 text-sm font-semibold disabled:opacity-40"
          style={{ color: style.accent }}
        >
          Add
        </button>
      </form>
    </section>
  );
}
