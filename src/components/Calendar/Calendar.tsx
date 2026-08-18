"use client";

import { CalendarGrid } from "@/components/CalendarGrid";
import { DayView } from "@/components/DayView";
import { WeekView } from "@/components/WeekView";
import { YearView } from "@/components/YearView";
import type { CalendarMode } from "@/lib/calendar";
import type { CalendarEvent } from "@/lib/events";

type CalendarProps = {
  viewDate: Date;
  calendarMode: CalendarMode;
  activeTagIds: string[];
  events: CalendarEvent[];
  onViewDateChange: (date: Date) => void;
  onCalendarModeChange: (mode: CalendarMode) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
  onDayDoubleClick?: (date: Date) => void;
};

export function Calendar({
  viewDate,
  calendarMode,
  activeTagIds,
  events,
  onViewDateChange,
  onCalendarModeChange,
  onSelectEvent,
  onDayDoubleClick,
}: CalendarProps) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      {calendarMode === "day" && (
        <DayView viewDate={viewDate} events={events} onSelectEvent={onSelectEvent} onDayDoubleClick={onDayDoubleClick} />
      )}
      {calendarMode === "week" && (
        <WeekView viewDate={viewDate} events={events} onSelectEvent={onSelectEvent} onDayDoubleClick={onDayDoubleClick} />
      )}
      {calendarMode === "month" && (
        <CalendarGrid
          viewDate={viewDate}
          activeTagIds={activeTagIds}
          events={events}
          onSelectEvent={onSelectEvent}
          onDayDoubleClick={onDayDoubleClick}
        />
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
