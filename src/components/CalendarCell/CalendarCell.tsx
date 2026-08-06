import type { CalendarDay } from "@/lib/calendar";

type CalendarCellProps = {
  day: CalendarDay;
};

export function CalendarCell({ day }: CalendarCellProps) {
  const dayNumber = day.date.getDate();

  return (
    <div
      className="group min-h-24 p-2 sm:min-h-28"
      style={{
        borderBottom: "1px solid var(--border)",
        borderRight: "1px solid var(--border)",
        background: day.isToday
          ? "var(--accent-muted)"
          : day.inCurrentMonth
            ? "var(--surface)"
            : "var(--surface-2)",
        transition: "background var(--transition-fast)",
        cursor: "pointer",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!day.isToday) {
          (e.currentTarget as HTMLElement).style.background = "var(--accent-muted)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = day.isToday
          ? "var(--accent-muted)"
          : day.inCurrentMonth
            ? "var(--surface)"
            : "var(--surface-2)";
      }}
    >
      {/* Today accent bar along the top */}
      {day.isToday && (
        <div
          className="absolute left-0 right-0 top-0 h-0.5"
          style={{ background: "var(--accent)" }}
        />
      )}

      <div className="flex justify-end">
        <span
          className={`flex h-7 w-7 items-center justify-center text-sm font-bold ${
            day.isToday ? "today-badge text-white" : ""
          }`}
          style={{
            borderRadius: "var(--radius-full)",
            background: day.isToday ? "var(--accent)" : "transparent",
            color: day.isToday
              ? "#fff"
              : day.inCurrentMonth
                ? "var(--foreground)"
                : "var(--text-muted)",
            // Slightly larger & bolder for today
            fontSize: day.isToday ? "0.8125rem" : undefined,
            transition: "all var(--transition-fast)",
          }}
        >
          {dayNumber}
        </span>
      </div>
      {/* Event chips will render here later */}
    </div>
  );
}
