import { TimeGrid } from "@/components/TimeGrid";
import { getWeekDays } from "@/lib/calendar";

type WeekViewProps = {
  viewDate: Date;
};

export function WeekView({ viewDate }: WeekViewProps) {
  const days = getWeekDays(viewDate);

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1.5px solid var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <TimeGrid days={days} />
    </div>
  );
}
