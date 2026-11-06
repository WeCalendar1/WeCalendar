"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { addMonths, getWeekdayLabels, isSameDay, startOfMonth } from "@/lib/calendar";

type MiniCalendarProps = {
  viewDate: Date;
  defaultOpen?: boolean;
  weekStartsOnMonday?: boolean;
  onSelectDate?: (date: Date) => void;
};

/** Compact month calendar for the sidebar with minimizable accordion, month browse, and date jump. */
export function MiniCalendar({
  viewDate,
  defaultOpen = true,
  weekStartsOnMonday = false,
  onSelectDate,
}: MiniCalendarProps) {
  const [open, setOpen] = useState(defaultOpen);
  const currentKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;
  const [browse, setBrowse] = useState<{ baseKey: string; offset: number }>({
    baseKey: currentKey,
    offset: 0,
  });

  const activeOffset = browse.baseKey === currentKey ? browse.offset : 0;
  const displayMonth = addMonths(startOfMonth(viewDate), activeOffset);

  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const rawFirstDay = new Date(year, month, 1).getDay();
  const firstDayOffset = weekStartsOnMonday ? (rawFirstDay + 6) % 7 : rawFirstDay;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const weekdays = getWeekdayLabels(weekStartsOnMonday, "narrow");

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const label = displayMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="flex flex-col gap-0"
      style={{
        borderRadius: "var(--radius-xl)",
        background: "var(--surface)",
        boxShadow: "inset 0 0 0 0.5px var(--hairline), var(--shadow-sm)",
      }}
    >
      <div
        className="flex w-full items-center justify-between px-3 py-2"
        style={{
          borderRadius: open ? "var(--radius-xl) var(--radius-xl) 0 0" : "var(--radius-xl)",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="sidebar-minicalendar-body"
          className="pressable flex min-w-0 flex-1 items-center gap-1.5 py-0.5 text-left"
          style={{ background: "transparent" }}
        >
          <span
            className="truncate text-sm font-semibold"
            style={{
              color: "var(--foreground)",
              letterSpacing: "-0.012em",
            }}
          >
            {label}
          </span>
          <motion.svg
            animate={{ rotate: open ? 0 : -90 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: "var(--text-muted)" }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M4 6l4 4 4-4" />
          </motion.svg>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label="Previous month"
            onClick={(e) => {
              e.stopPropagation();
              if (!open) setOpen(true);
              setBrowse({ baseKey: currentKey, offset: activeOffset - 1 });
            }}
            className="pressable flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-sm font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={(e) => {
              e.stopPropagation();
              if (!open) setOpen(true);
              setBrowse({ baseKey: currentKey, offset: activeOffset + 1 });
            }}
            className="pressable flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-sm font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            ›
          </button>
        </div>
      </div>

      <motion.div
        id="sidebar-minicalendar-body"
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        style={{ overflow: "hidden" }}
      >
        <div className="px-3 pb-3">
          <div className="grid grid-cols-7 gap-y-0.5 text-center text-[11px]">
            {weekdays.map((day, i) => (
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
              const cellDate = new Date(year, month, day);
              const isToday = isSameDay(cellDate, today);
              const isSelected = isSameDay(cellDate, viewDate);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onSelectDate?.(cellDate)}
                  className={`mx-auto flex h-6 w-6 cursor-pointer items-center justify-center text-xs font-semibold ${
                    isToday ? "today-badge text-white" : ""
                  }`}
                  style={{
                    borderRadius: "var(--radius-full)",
                    background: isToday
                      ? "var(--accent)"
                      : isSelected
                        ? "var(--accent-muted)"
                        : "transparent",
                    color: isToday
                      ? "#fff"
                      : isSelected
                        ? "var(--accent)"
                        : "var(--foreground)",
                    boxShadow:
                      isSelected && !isToday
                        ? "inset 0 0 0 1.5px var(--accent)"
                        : undefined,
                    transition: "background var(--transition-fast)",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
