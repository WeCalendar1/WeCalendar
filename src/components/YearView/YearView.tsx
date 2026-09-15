"use client";

import { useState, useEffect } from "react";
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
  todayJumpKey?: number;
};

function MiniMonth({
  monthDate,
  onSelectMonth,
  onSelectDay,
  onModeChange,
  todayJumpKey,
}: {
  monthDate: Date;
  onSelectMonth: (date: Date) => void;
  onSelectDay: (date: Date) => void;
  onModeChange: (mode: CalendarMode) => void;
  todayJumpKey?: number;
}) {
  const days = getMonthGrid(monthDate);
  const today = new Date();
  const label = monthDate.toLocaleDateString("en-US", { month: "long" });

  const [isFlashing, setIsFlashing] = useState(false);
  const isCurrentMonth = monthDate.getMonth() === today.getMonth() && monthDate.getFullYear() === today.getFullYear();

  useEffect(() => {
    if (todayJumpKey && todayJumpKey > 0 && isCurrentMonth) {
      setIsFlashing(true);
      const t = setTimeout(() => setIsFlashing(false), 800);
      return () => clearTimeout(t);
    }
  }, [todayJumpKey, isCurrentMonth]);

  return (
    <div
      className="flex flex-col p-3"
      style={{
        borderRadius: "var(--radius-lg)",
        background: "var(--surface)",
        boxShadow: "inset 0 0 0 0.5px var(--hairline), var(--shadow-sm)",
      }}
    >
      <button
        type="button"
        onClick={() => {
          onSelectMonth(startOfMonth(monthDate));
          onModeChange("month");
        }}
        className="mb-2 cursor-pointer self-start px-1 text-sm font-semibold"
        style={{
          color: "var(--accent)",
          letterSpacing: "-0.01em",
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
              className={`relative z-10 mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium disabled:cursor-default ${isFlashing && isToday ? "animate-pop-bounce" : ""}`}
              style={{
                background: (isFlashing && isToday) 
                  ? "color-mix(in srgb, var(--accent) 70%, var(--background))" 
                  : isToday 
                    ? "var(--accent)" 
                    : "transparent",
                color: isToday
                  ? "#fff"
                  : day.inCurrentMonth
                    ? "var(--foreground)"
                    : "transparent",
                cursor: day.inCurrentMonth ? "pointer" : "default",
                transition: "background 0.3s ease-out",
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
  todayJumpKey,
}: YearViewProps) {
  const year = viewDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, month) => new Date(year, month, 1));

  return (
    <div
      className="h-full min-h-0 overflow-auto p-1 sm:p-2"
      style={{
        borderRadius: "var(--radius-xl)",
        background: "var(--surface-2)",
        boxShadow: "inset 0 0 0 0.5px var(--hairline), var(--shadow-sm)",
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
            todayJumpKey={todayJumpKey}
          />
        ))}
      </div>
    </div>
  );
}
