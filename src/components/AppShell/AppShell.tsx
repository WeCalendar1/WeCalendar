"use client";

import { useState } from "react";
import { Calendar } from "@/components/Calendar";
import { Navbar } from "@/components/Navbar";
import { RightPanel } from "@/components/RightPanel";
import { Sidebar } from "@/components/Sidebar";
import {
  addMonths,
  formatMonthYear,
  startOfMonth,
  type CalendarMode,
  type ScreenView,
} from "@/lib/calendar";

// All tag IDs — kept in sync with DEFAULT_TAGS in Sidebar
const ALL_TAG_IDS = ["personal", "work", "birthdays", "holidays", "reminders", "shared"];

export function AppShell() {
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()));
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [screenView, setScreenView] = useState<ScreenView>("calendar");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTagIds, setActiveTagIds] = useState<string[]>(ALL_TAG_IDS);
  const [searchQuery, setSearchQuery] = useState("");

  const showRightPanel = screenView === "tasks" || screenView === "map";

  function handleTagToggle(id: string) {
    setActiveTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Navbar
        monthLabel={formatMonthYear(viewDate)}
        calendarMode={calendarMode}
        screenView={screenView}
        sidebarOpen={sidebarOpen}
        searchQuery={searchQuery}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onToday={() => setViewDate(startOfMonth(new Date()))}
        onPrev={() => setViewDate((d) => addMonths(d, -1))}
        onNext={() => setViewDate((d) => addMonths(d, 1))}
        onCalendarModeChange={setCalendarMode}
        onScreenViewChange={setScreenView}
        onSearchChange={setSearchQuery}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          open={sidebarOpen}
          viewDate={viewDate}
          activeTagIds={activeTagIds}
          onCreateEvent={() => {
            // Event creation comes in a later milestone
          }}
          onTagToggle={handleTagToggle}
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
          <Calendar
            viewDate={viewDate}
            calendarMode={calendarMode}
            activeTagIds={activeTagIds}
          />
        </main>

        <RightPanel visible={showRightPanel} />
      </div>
    </div>
  );
}
