"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Calendar } from "@/components/Calendar";
import { CreateEventModal } from "@/components/CreateEventModal";
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
import type { CalendarEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

type Group = Tables<"groups">;

// All tag IDs — kept in sync with DEFAULT_TAGS in Sidebar
const ALL_TAG_IDS = ["personal", "work", "birthdays", "holidays", "reminders", "shared"];
const ACTIVE_GROUP_KEY = "wecalendar.activeGroupId";

export function AppShell() {
  const [viewDate, setViewDate] = useState(() => startOfDay(new Date()));
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [screenView, setScreenView] = useState<ScreenView>("calendar");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTagIds, setActiveTagIds] = useState<string[]>(ALL_TAG_IDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const showRightPanel = screenView === "tasks" || screenView === "map";

  const loadGroups = useCallback(async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("loadGroups", error);
      return;
    }

    const nextGroups = data ?? [];
    setGroups(nextGroups);

    setActiveGroupId((current) => {
      if (current && nextGroups.some((g) => g.id === current)) return current;
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(ACTIVE_GROUP_KEY)
          : null;
      if (stored && nextGroups.some((g) => g.id === stored)) return stored;
      return nextGroups[0]?.id ?? null;
    });
  }, [supabase]);

  const loadEvents = useCallback(
    async (groupId: string | null) => {
      if (!groupId) {
        setEvents([]);
        return;
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("group_id", groupId)
        .order("starts_at", { ascending: true });

      if (error) {
        console.error("loadEvents", error);
        return;
      }

      setEvents(data ?? []);
    },
    [supabase],
  );

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

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setActiveGroupId(null);
      setEvents([]);
      return;
    }
    void loadGroups();
  }, [user, loadGroups]);

  useEffect(() => {
    if (activeGroupId) {
      window.localStorage.setItem(ACTIVE_GROUP_KEY, activeGroupId);
    }
    void loadEvents(activeGroupId);
  }, [activeGroupId, loadEvents]);

  // Realtime sync for shared events
  useEffect(() => {
    if (!activeGroupId) return;

    const channel = supabase
      .channel(`events:${activeGroupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `group_id=eq.${activeGroupId}`,
        },
        () => {
          void loadEvents(activeGroupId);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeGroupId, loadEvents, supabase]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.trim().toLowerCase();
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(q) ||
        (event.description ?? "").toLowerCase().includes(q),
    );
  }, [events, searchQuery]);

  async function handleCreateGroup(name: string) {
    const { data, error } = await supabase.rpc("create_group", { p_name: name });
    if (error) throw new Error(error.message);
    await loadGroups();
    if (data?.id) setActiveGroupId(data.id);
  }

  async function handleJoinGroup(inviteCode: string) {
    const { data, error } = await supabase.rpc("join_group_by_invite", {
      p_invite_code: inviteCode,
    });
    if (error) throw new Error(error.message);
    await loadGroups();
    if (data?.id) setActiveGroupId(data.id);
  }

  async function handleCreateEvent(input: {
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
  }) {
    if (!user || !activeGroupId) {
      throw new Error("Join or create a shared workspace first.");
    }

    const { error } = await supabase.from("events").insert({
      group_id: activeGroupId,
      title: input.title,
      description: input.description || null,
      starts_at: input.startsAt.toISOString(),
      ends_at: input.endsAt.toISOString(),
      created_by: user.id,
    });

    if (error) throw new Error(error.message);
    await loadEvents(activeGroupId);
  }

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
          onCreateEvent={() => setCreateOpen(true)}
          onTagToggle={handleTagToggle}
          groups={groups}
          activeGroupId={activeGroupId}
          onSelectGroup={setActiveGroupId}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          canCreateEvent={Boolean(activeGroupId)}
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          {!activeGroupId && (
            <div
              className="mb-3 rounded-xl px-4 py-3 text-sm"
              style={{
                background: "var(--accent-muted)",
                color: "var(--accent-text)",
                border: "1px solid var(--border)",
              }}
            >
              Create a shared workspace or join with an invite code to sync calendars
              between accounts.
            </div>
          )}
          <Calendar
            viewDate={viewDate}
            calendarMode={calendarMode}
            activeTagIds={activeTagIds}
            events={filteredEvents}
            onViewDateChange={setViewDate}
            onCalendarModeChange={setCalendarMode}
          />
        </main>

        <RightPanel visible={showRightPanel} />
      </div>

      <CreateEventModal
        open={createOpen}
        defaultDate={viewDate}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateEvent}
      />
    </div>
  );
}
