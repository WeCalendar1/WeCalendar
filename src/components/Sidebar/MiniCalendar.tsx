type MiniCalendarProps = {
  viewDate: Date;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Compact month calendar for the sidebar. */
export function MiniCalendar({ viewDate }: MiniCalendarProps) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const label = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="p-3"
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1.5px solid var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <p
        className="mb-2 text-sm font-semibold"
        style={{
          color: "var(--foreground)",
          fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
        }}
      >
        {label}
      </p>
      <div className="grid grid-cols-7 gap-y-0.5 text-center text-[11px]">
        {WEEKDAYS.map((day, i) => (
          <span
            key={`${day}-${i}`}
            className="py-1 font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            {day}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <span key={`empty-${i}`} />;
          }
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          return (
            <span
              key={day}
              className={`mx-auto flex h-6 w-6 items-center justify-center text-xs font-semibold ${
                isToday ? "today-badge text-white" : "cursor-pointer"
              }`}
              style={{
                borderRadius: "var(--radius-full)",
                background: isToday ? "var(--accent)" : "transparent",
                color: isToday ? "#fff" : "var(--foreground)",
                transition: "background var(--transition-fast)",
              }}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
