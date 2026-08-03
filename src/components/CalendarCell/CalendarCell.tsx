import type { CalendarDay } from "@/lib/calendar";

type CalendarCellProps = {
  day: CalendarDay;
};

export function CalendarCell({ day }: CalendarCellProps) {
  const dayNumber = day.date.getDate();

  return (
    <div
      className={`min-h-24 border-b border-r border-border p-2 transition-colors sm:min-h-28 ${
        day.inCurrentMonth ? "bg-surface" : "bg-stone-50/70"
      }`}
    >
      <div className="flex justify-end">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
            day.isToday
              ? "bg-accent font-semibold text-white shadow-sm"
              : day.inCurrentMonth
                ? "font-medium text-foreground"
                : "text-stone-400"
          }`}
        >
          {dayNumber}
        </span>
      </div>
      {/* Event placeholders will render here later */}
    </div>
  );
}
