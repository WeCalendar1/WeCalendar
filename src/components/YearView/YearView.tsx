"use client";

import {
  getMonthGrid,
  isSameDay,
  startOfMonth,
  type CalendarMode,
} from "@/lib/calendar";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type YearViewProps = {
  viewDate: Date;
  onSelectMonth: (date: Date) => void;
  onSelectDay: (date: Date) => void;
  onModeChange: (mode: CalendarMode) => void;
};

function MiniMonth({
  monthDate,
  onSelectMonth,
  onSelectDay,
  onModeChange,
}: {
  monthDate: Date;
  onSelectMonth: (date: Date) => void;
  onSelectDay: (date: Date) => void;
  onModeChange: (mode: CalendarMode) => void;
}) {
  const days = getMonthGrid(monthDate);
  const today = new Date();
  const label = monthDate.toLocaleDateString("en-US", { month: "long" });

  return (
    <div
      className="flex flex-col p-3"
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1.5px solid var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <button
        type="button"
        onClick={() => {
          onSelectMonth(startOfMonth(monthDate));
          onModeChange("month");
        }}
        className="mb-2 cursor-pointer self-start px-1 text-sm font-semibold transition hover:underline"
        style={{
          color: "var(--accent)",
          fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
        }}
      >
        {label}
      </button>

      <div className="grid grid-cols-7 gap-y-0.5 text-center text-[10px]">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`} className="py-1 font-semibold" style={{ color: "var(--text-muted)" }}>
            {d}
          </span>
        ))}
        {days.map((day) => {
          const isToday = isSameDay(day.date, today);
          return (
            <button
              key={day.date.toISOString()}
              type="button"
              disabled={!day.inCurrentMonth}
              onClick={() => {
                onSelectDay(day.date);
                onModeChange("day");
              }}
              className="mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium disabled:cursor-default"
              style={{
                background: isToday ? "var(--accent)" : "transparent",
                color: isToday
                  ? "#fff"
                  : day.inCurrentMonth
                    ? "var(--foreground)"
                    : "transparent",
                cursor: day.inCurrentMonth ? "pointer" : "default",
              }}
            >
              {day.inCurrentMonth ? day.date.getDate() : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function YearView({
  viewDate,
  onSelectMonth,
  onSelectDay,
  onModeChange,
}: YearViewProps) {
  const year = viewDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, month) => new Date(year, month, 1));

  return (
    <div
      className="h-full min-h-0 overflow-auto p-1 sm:p-2"
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1.5px solid var(--border)",
        background: "var(--surface-2)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div className="grid grid-cols-1 gap-3 p-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map((monthDate) => (
          <MiniMonth
            key={monthDate.toISOString()}
            monthDate={monthDate}
            onSelectMonth={onSelectMonth}
            onSelectDay={onSelectDay}
            onModeChange={onModeChange}
          />
        ))}
      </div>
    </div>
  );
}
