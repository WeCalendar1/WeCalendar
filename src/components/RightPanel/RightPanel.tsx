type RightPanelProps = {
  visible?: boolean;
};

/**
 * Placeholder for Tasks / Map content.
 * Hidden by default until those screen views are implemented.
 */
export function RightPanel({ visible = false }: RightPanelProps) {
  if (!visible) {
    return null;
  }

  return (
    <aside className="hidden w-72 shrink-0 border-l border-border bg-surface lg:flex lg:flex-col">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Panel</p>
        <p className="text-xs text-stone-500">Tasks & Map placeholder</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-4 text-sm text-stone-400">
        Content coming soon
      </div>
    </aside>
  );
}
