"use client";

import { useState } from "react";
import { CalendarGrid } from "@/components/CalendarGrid";
import type { CalendarMode } from "@/lib/calendar";

type CalendarProps = {
  viewDate: Date;
  calendarMode: CalendarMode;
  activeTagIds: string[];
};

export function Calendar({ viewDate, calendarMode, activeTagIds }: CalendarProps) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
      {calendarMode === "month" ? (
        <CalendarGrid viewDate={viewDate} activeTagIds={activeTagIds} />
      ) : (
        <div
          className="flex h-full items-center justify-center text-sm"
          style={{
            borderRadius: "var(--radius-xl)",
            border: "1.5px dashed var(--border)",
            background: "var(--surface)",
            color: "var(--text-secondary)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {calendarMode.charAt(0).toUpperCase() + calendarMode.slice(1)} view
          coming soon
        </div>
      )}
    </section>
  );
}
