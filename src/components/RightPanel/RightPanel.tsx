type RightPanelProps = {
  visible?: boolean;
};

export function RightPanel({ visible = false }: RightPanelProps) {
  if (!visible) {
    return null;
  }

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
          Map
        </p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Map view is not available yet
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center p-4 text-sm" style={{ color: "var(--text-muted)" }}>
        Content coming soon
      </div>
    </aside>
  );
}
