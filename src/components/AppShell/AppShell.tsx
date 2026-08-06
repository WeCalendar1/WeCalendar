"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Calendar } from "@/components/Calendar";
import { Navbar } from "@/components/Navbar";
import { RightPanel } from "@/components/RightPanel";
import { Sidebar } from "@/components/Sidebar";
import { getInitials } from "@/lib/auth";
import {
  formatViewLabel,
  shiftViewDate,
  startOfDay,
  type CalendarMode,
  type ScreenView,
} from "@/lib/calendar";
import { createClient } from "@/lib/supabase/client";

// All tag IDs — kept in sync with DEFAULT_TAGS in Sidebar
const ALL_TAG_IDS = ["personal", "work", "birthdays", "holidays", "reminders", "shared"];

// All tag IDs — kept in sync with DEFAULT_TAGS in Sidebar
const ALL_TAG_IDS = ["personal", "work", "birthdays", "holidays", "reminders", "shared"];

export function AppShell() {
  const [viewDate, setViewDate] = useState(() => startOfDay(new Date()));
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [screenView, setScreenView] = useState<ScreenView>("calendar");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTagIds, setActiveTagIds] = useState<string[]>(ALL_TAG_IDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const showRightPanel = screenView === "tasks" || screenView === "map";

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function handleTagToggle(id: string) {
    setActiveTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  const userInitials = getInitials(
    (user?.user_metadata?.display_name as string | undefined) || user?.email,
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Navbar
        monthLabel={formatViewLabel(viewDate, calendarMode)}
        calendarMode={calendarMode}
        screenView={screenView}
        sidebarOpen={sidebarOpen}
        searchQuery={searchQuery}
        userInitials={userInitials}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onToday={() => setViewDate(startOfDay(new Date()))}
        onPrev={() => setViewDate((d) => shiftViewDate(d, calendarMode, -1))}
        onNext={() => setViewDate((d) => shiftViewDate(d, calendarMode, 1))}
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

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          <Calendar
            viewDate={viewDate}
            calendarMode={calendarMode}
            activeTagIds={activeTagIds}
            onViewDateChange={setViewDate}
            onCalendarModeChange={setCalendarMode}
          />
        </main>

        <RightPanel visible={showRightPanel} />
      </div>
    </div>
  );
}
