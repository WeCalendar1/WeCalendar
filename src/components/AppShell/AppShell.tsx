"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Calendar } from "@/components/Calendar";
import { CreateEventModal, type EventDraft } from "@/components/CreateEventModal";
import { Navbar } from "@/components/Navbar";
import { RightPanel } from "@/components/RightPanel";
import { Sidebar } from "@/components/Sidebar";
import type { ListCategory, ListItem, SharedList } from "@/components/TaskPanel";
import { getInitials } from "@/lib/auth";
import {
  formatViewLabel,
  shiftViewDate,
  startOfDay,
  type CalendarMode,
  type ScreenView,
} from "@/lib/calendar";
import type { CalendarEvent } from "@/lib/events";
import {
  isSchedulingConflictError,
  SCHEDULING_CONFLICT_MESSAGE,
} from "@/lib/scheduling";
import { tagIdsForEvent, type EventTag, type Tag } from "@/lib/tags";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

type Group = Tables<"groups">;

const ACTIVE_GROUP_KEY = "wecalendar.activeGroupId";

export function AppShell() {
  const [viewDate, setViewDate] = useState(() => startOfDay(new Date()));
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [screenView, setScreenView] = useState<ScreenView>("calendar");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [eventTags, setEventTags] = useState<EventTag[]>([]);
  const [lists, setLists] = useState<SharedList[]>([]);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<Date>(() => startOfDay(new Date()));

  const supabase = useMemo(() => createClient(), []);
  const showRightPanel = screenView === "tasks" || screenView === "map";

  // ─── Data loaders ────────────────────────────────────────────────────────

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

      const nextEvents = data ?? [];
      setEvents(nextEvents);
      setSelectedEvent((current) => {
        if (!current) return current;
        const next = nextEvents.find((event) => event.id === current.id) ?? null;
        if (!next) setModalOpen(false);
        return next;
      });
    },
    [supabase],
  );

  const loadTags = useCallback(
    async (groupId: string | null) => {
      if (!groupId) {
        setTags([]);
        return;
      }
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("loadTags", error);
        return;
      }
      setTags(data ?? []);
    },
    [supabase],
  );

  const loadEventTags = useCallback(
    async (groupId: string | null) => {
      if (!groupId) {
        setEventTags([]);
        return;
      }
      // Join through events to filter by group
      const { data, error } = await supabase
        .from("event_tags")
        .select("event_id, tag_id, tags!inner(group_id)")
        .eq("tags.group_id", groupId);

      if (error) {
        console.error("loadEventTags", error);
        return;
      }
      setEventTags(
        (data ?? []).map((row) => ({ event_id: row.event_id, tag_id: row.tag_id })),
      );
    },
    [supabase],
  );

  const loadLists = useCallback(
    async (groupId: string | null) => {
      if (!groupId) {
        setLists([]);
        setListItems([]);
        return;
      }

      const { data: nextLists, error: listsError } = await supabase
        .from("lists")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (listsError) {
        console.error("loadLists", listsError);
        return;
      }

      const loadedLists = nextLists ?? [];
      setLists(loadedLists);

      if (loadedLists.length === 0) {
        setListItems([]);
        return;
      }

      const { data: nextItems, error: itemsError } = await supabase
        .from("list_items")
        .select("*")
        .in(
          "list_id",
          loadedLists.map((list) => list.id),
        )
        .order("sort_order", { ascending: true });

      if (itemsError) {
        console.error("loadListItems", itemsError);
        return;
      }

      setListItems(nextItems ?? []);
    },
    [supabase],
  );

  // ─── Auth effects ─────────────────────────────────────────────────────────

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
      setGroups([]); // eslint-disable-line react-hooks/set-state-in-effect
      setActiveGroupId(null); // eslint-disable-line react-hooks/set-state-in-effect
      setEvents([]); // eslint-disable-line react-hooks/set-state-in-effect
      setTags([]); // eslint-disable-line react-hooks/set-state-in-effect
      setEventTags([]); // eslint-disable-line react-hooks/set-state-in-effect
      setLists([]); // eslint-disable-line react-hooks/set-state-in-effect
      setListItems([]); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    void loadGroups();
  }, [user, loadGroups]);

  useEffect(() => {
    if (activeGroupId) {
      window.localStorage.setItem(ACTIVE_GROUP_KEY, activeGroupId);
    }
    void loadEvents(activeGroupId); // eslint-disable-line react-hooks/set-state-in-effect
    void loadTags(activeGroupId); // eslint-disable-line react-hooks/set-state-in-effect
    void loadEventTags(activeGroupId); // eslint-disable-line react-hooks/set-state-in-effect
    void loadLists(activeGroupId); // eslint-disable-line react-hooks/set-state-in-effect
  }, [activeGroupId, loadEvents, loadTags, loadEventTags, loadLists]);

  // ─── Realtime subscriptions ───────────────────────────────────────────────

  useEffect(() => {
    if (!activeGroupId) return;

    const channel = supabase
      .channel(`group-data:${activeGroupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `group_id=eq.${activeGroupId}` },
        () => { void loadEvents(activeGroupId); },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tags", filter: `group_id=eq.${activeGroupId}` },
        () => { void loadTags(activeGroupId); },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_tags" },
        () => { void loadEventTags(activeGroupId); },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lists", filter: `group_id=eq.${activeGroupId}` },
        () => { void loadLists(activeGroupId); },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "list_items" },
        () => { void loadLists(activeGroupId); },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [activeGroupId, loadEvents, loadTags, loadEventTags, loadLists, supabase]);

  // ─── Filtered events ──────────────────────────────────────────────────────

  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(q) ||
          (event.description ?? "").toLowerCase().includes(q),
      );
    }

    // Tag filter — if any tags active, only show events that have at least one
    if (activeTagIds.length > 0) {
      filtered = filtered.filter((event) => {
        const ids = tagIdsForEvent(event.id, eventTags);
        return ids.some((id) => activeTagIds.includes(id));
      });
    }

    return filtered;
  }, [events, searchQuery, activeTagIds, eventTags]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

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

  async function handleCreateTag(name: string, color: string) {
    if (!user || !activeGroupId) throw new Error("Join or create a calendar first.");
    const { error } = await supabase.from("tags").insert({
      group_id: activeGroupId,
      name,
      color,
      created_by: user.id,
    });
    if (error) throw new Error(error.message);
    await loadTags(activeGroupId);
  }

  async function handleCreateEvent(input: EventDraft) {
    if (!user || !activeGroupId) {
      throw new Error("Join or create a shared workspace first.");
    }

    const { data: eventData, error } = await supabase
      .from("events")
      .insert({
        group_id: activeGroupId,
        title: input.title,
        description: input.description || null,
        starts_at: input.startsAt.toISOString(),
        ends_at: input.endsAt.toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (isSchedulingConflictError(error)) {
        throw new Error(SCHEDULING_CONFLICT_MESSAGE);
      }
      throw new Error(error.message);
    }

    // Attach tags
    if (eventData && input.tagIds.length > 0) {
      await supabase.from("event_tags").insert(
        input.tagIds.map((tagId) => ({ event_id: eventData.id, tag_id: tagId })),
      );
    }

    await loadEvents(activeGroupId);
    await loadEventTags(activeGroupId);
  }

  async function handleUpdateEvent(eventId: string, input: EventDraft) {
    if (!activeGroupId) {
      throw new Error("Join or create a shared workspace first.");
    }

    const { error } = await supabase
      .from("events")
      .update({
        title: input.title,
        description: input.description || null,
        starts_at: input.startsAt.toISOString(),
        ends_at: input.endsAt.toISOString(),
      })
      .eq("id", eventId);

    if (error) {
      if (isSchedulingConflictError(error)) {
        throw new Error(SCHEDULING_CONFLICT_MESSAGE);
      }
      throw new Error(error.message);
    }

    // Replace tag assignments
    await supabase.from("event_tags").delete().eq("event_id", eventId);
    if (input.tagIds.length > 0) {
      await supabase.from("event_tags").insert(
        input.tagIds.map((tagId) => ({ event_id: eventId, tag_id: tagId })),
      );
    }

    await loadEvents(activeGroupId);
    await loadEventTags(activeGroupId);
  }

  async function handleDeleteEvent(eventId: string) {
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) throw new Error(error.message);
    setSelectedEvent(null);
    await loadEvents(activeGroupId);
    await loadEventTags(activeGroupId);
  }

  function openCreateModal(date?: Date) {
    setSelectedEvent(null);
    setModalDefaultDate(date ?? viewDate);
    setModalOpen(true);
  }

  function openEventDetails(event: CalendarEvent) {
    setSelectedEvent(event);
    setModalOpen(true);
  }

  function closeEventModal() {
    setModalOpen(false);
    setSelectedEvent(null);
  }

  function handleTagToggle(id: string) {
    setActiveTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function handleCreateList(name: string, category: ListCategory) {
    if (!user || !activeGroupId) {
      throw new Error("Join or create a shared workspace first.");
    }
    const { error } = await supabase.from("lists").insert({
      group_id: activeGroupId,
      name,
      category,
      created_by: user.id,
    });
    if (error) throw new Error(error.message);
    await loadLists(activeGroupId);
  }

  async function handleDeleteList(listId: string) {
    const { error } = await supabase.from("lists").delete().eq("id", listId);
    if (error) throw new Error(error.message);
    await loadLists(activeGroupId);
  }

  async function handleAddListItem(listId: string, content: string) {
    if (!user) throw new Error("Sign in to add items.");
    const siblingCount = listItems.filter((item) => item.list_id === listId).length;
    const { error } = await supabase.from("list_items").insert({
      list_id: listId,
      content,
      created_by: user.id,
      sort_order: siblingCount,
    });
    if (error) throw new Error(error.message);
    await loadLists(activeGroupId);
  }

  async function handleToggleListItem(itemId: string, isChecked: boolean) {
    const { error } = await supabase
      .from("list_items")
      .update({ is_checked: isChecked })
      .eq("id", itemId);
    if (error) throw new Error(error.message);
    setListItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, is_checked: isChecked } : item)),
    );
  }

  async function handleDeleteListItem(itemId: string) {
    const { error } = await supabase.from("list_items").delete().eq("id", itemId);
    if (error) throw new Error(error.message);
    setListItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  const userInitials = getInitials(
    (user?.user_metadata?.display_name as string | undefined) || user?.email,
  );

  // Tag IDs on the currently-selected event (for the modal)
  const selectedEventTagIds = selectedEvent
    ? tagIdsForEvent(selectedEvent.id, eventTags)
    : [];

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
          onCreateEvent={openCreateModal}
          onTagToggle={handleTagToggle}
          tags={tags}
          onCreateTag={handleCreateTag}
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
            tags={tags}
            eventTags={eventTags}
            onViewDateChange={setViewDate}
            onCalendarModeChange={setCalendarMode}
            onSelectEvent={openEventDetails}
            onDayDoubleClick={openCreateModal}
          />
        </main>

        <RightPanel
          visible={showRightPanel}
          view={screenView}
          groupId={activeGroupId}
          lists={lists}
          items={listItems}
          onCreateList={handleCreateList}
          onDeleteList={handleDeleteList}
          onAddItem={handleAddListItem}
          onToggleItem={handleToggleListItem}
          onDeleteItem={handleDeleteListItem}
        />
      </div>

      <CreateEventModal
        key={
          selectedEvent
            ? selectedEvent.id
            : modalOpen
              ? `create-${modalDefaultDate.toISOString()}`
              : "closed"
        }
        open={modalOpen}
        defaultDate={modalDefaultDate}
        event={selectedEvent}
        tags={tags}
        initialTagIds={selectedEventTagIds}
        onClose={closeEventModal}
        onCreate={handleCreateEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        onCreateTag={handleCreateTag}
      />
    </div>
  );
}
