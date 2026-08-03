export type CalendarMode = "day" | "week" | "month" | "year";
export type ScreenView = "calendar" | "tasks" | "map";

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
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
