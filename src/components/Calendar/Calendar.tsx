"use client";

import { CalendarGrid } from "@/components/CalendarGrid";
import { DayView } from "@/components/DayView";
import { WeekView } from "@/components/WeekView";
import { YearView } from "@/components/YearView";
import type { CalendarMode } from "@/lib/calendar";

type CalendarProps = {
  viewDate: Date;
  calendarMode: CalendarMode;
  activeTagIds: string[];
  onViewDateChange: (date: Date) => void;
  onCalendarModeChange: (mode: CalendarMode) => void;
};

export function Calendar({
  viewDate,
  calendarMode,
  activeTagIds,
  onViewDateChange,
  onCalendarModeChange,
}: CalendarProps) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      {calendarMode === "day" && <DayView viewDate={viewDate} />}
      {calendarMode === "week" && <WeekView viewDate={viewDate} />}
      {calendarMode === "month" && (
        <CalendarGrid viewDate={viewDate} activeTagIds={activeTagIds} />
      )}
      {calendarMode === "year" && (
        <YearView
          viewDate={viewDate}
          onSelectMonth={onViewDateChange}
          onSelectDay={onViewDateChange}
          onModeChange={onCalendarModeChange}
        />
      )}
    </section>
  );
}
