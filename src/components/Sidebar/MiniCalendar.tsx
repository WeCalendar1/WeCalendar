"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type MiniCalendarProps = {
  viewDate: Date;
  defaultOpen?: boolean;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Compact month calendar for the sidebar with minimizable accordion. */
export function MiniCalendar({ viewDate, defaultOpen = true }: MiniCalendarProps) {
  const [open, setOpen] = useState(defaultOpen);

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
      className="flex flex-col gap-0"
      style={{
        borderRadius: "var(--radius-xl)",
        background: "var(--surface)",
        boxShadow: "inset 0 0 0 0.5px var(--hairline), var(--shadow-sm)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="sidebar-minicalendar-body"
        className="pressable flex w-full items-center justify-between px-3 py-2.5"
        style={{
          background: "transparent",
          borderRadius: open ? "var(--radius-xl) var(--radius-xl) 0 0" : "var(--radius-xl)",
        }}
      >
        <span
          className="text-sm font-semibold"
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

      <motion.div
        id="sidebar-minicalendar-body"
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        style={{ overflow: "hidden" }}
      >
        <div className="px-3 pb-3">
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
      </motion.div>
    </div>
  );
}
