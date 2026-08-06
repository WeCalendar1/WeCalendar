export type CalendarMode = "day" | "week" | "month" | "year";
export type ScreenView = "calendar" | "tasks" | "map";

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return d;
}

export function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function addMonths(date: Date, amount: number): Date {
  const day = date.getDate();
  const result = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const maxDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, maxDay));
  return result;
}

export function addYears(date: Date, amount: number): Date {
  return new Date(date.getFullYear() + amount, date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatWeekLabel(date: Date): string {
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }

  if (sameYear) {
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${end.getFullYear()}`;
  }

  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function formatYearLabel(date: Date): string {
  return String(date.getFullYear());
}

export function formatViewLabel(date: Date, mode: CalendarMode): string {
  switch (mode) {
    case "day":
      return formatDayLabel(date);
    case "week":
      return formatWeekLabel(date);
    case "year":
      return formatYearLabel(date);
    case "month":
    default:
      return formatMonthYear(date);
  }
}

export function shiftViewDate(date: Date, mode: CalendarMode, direction: -1 | 1): Date {
  switch (mode) {
    case "day":
      return addDays(date, direction);
    case "week":
      return addDays(date, direction * 7);
    case "year":
      return addYears(date, direction);
    case "month":
    default:
      return addMonths(date, direction);
  }
}

export function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/** Hours shown in day/week time grids (midnight–11 PM). */
export const DAY_HOURS = Array.from({ length: 24 }, (_, i) => i);

export type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
};

/** Builds a Sunday–Saturday month grid (6 weeks × 7 days). */
export function getMonthGrid(viewDate: Date, today = new Date()): CalendarDay[] {
  const first = startOfMonth(viewDate);
  const startOffset = first.getDay(); // 0 = Sunday
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    days.push({
      date,
      inCurrentMonth: isSameMonth(date, viewDate),
      isToday: isSameDay(date, today),
    });
  }
  return days;
}

/** Seven days of the week containing `viewDate` (Sunday–Saturday). */
export function getWeekDays(viewDate: Date, today = new Date()): CalendarDay[] {
  const start = startOfWeek(viewDate);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return {
      date,
      inCurrentMonth: isSameMonth(date, viewDate),
      isToday: isSameDay(date, today),
    };
  });
}

/** Minutes from midnight for a “now” indicator (local time). */
export function getMinutesSinceMidnight(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}
