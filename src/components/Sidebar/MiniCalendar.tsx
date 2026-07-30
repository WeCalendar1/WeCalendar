type MiniCalendarProps = {
  viewDate: Date;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Compact month placeholder for the sidebar — navigation lives in the main grid for now. */
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
    <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {WEEKDAYS.map((day, i) => (
          <span key={`${day}-${i}`} className="py-1 font-medium text-stone-400">
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
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full ${
                isToday
                  ? "bg-accent font-semibold text-white"
                  : "text-stone-700"
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
