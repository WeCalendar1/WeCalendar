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
        background: day.inCurrentMonth ? "var(--surface)" : "var(--surface-2)",
        transition: "background var(--transition-fast)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--accent-muted)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = day.inCurrentMonth
          ? "var(--surface)"
          : "var(--surface-2)";
      }}
    >
      <div className="flex justify-end">
        <span
          className={`flex h-7 w-7 items-center justify-center text-sm font-semibold ${
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
            transition: "all var(--transition-fast)",
          }}
        >
          {dayNumber}
        </span>
      </div>
      {/* Event chips will render here */}
    </div>
  );
}
