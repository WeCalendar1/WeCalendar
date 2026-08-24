import { TaskPanel, type ListCategory, type ListItem, type SharedList } from "@/components/TaskPanel";

type RightPanelProps = {
  visible?: boolean;
  view: "calendar" | "tasks" | "map";
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

export function RightPanel({
  visible = false,
  view,
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
}: RightPanelProps) {
  if (!visible) {
    return null;
  }

  const isTasks = view === "tasks";

  return (
    <aside
      className="flex w-full shrink-0 flex-col border-l sm:w-80"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
      }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {isTasks ? "Tasks" : "Map"}
        </p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {isTasks
            ? "Shared lists for this workspace"
            : "Map view is not available yet"}
        </p>
      </div>

      {isTasks ? (
        <TaskPanel
          groupId={groupId}
          lists={lists}
          items={items}
          onCreateList={onCreateList}
          onRenameList={onRenameList}
          onDeleteList={onDeleteList}
          onAddItem={onAddItem}
          onToggleItem={onToggleItem}
          onDeleteItem={onDeleteItem}
          onReorderItems={onReorderItems}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Content coming soon
        </div>
      )}
    </aside>
  );
}
