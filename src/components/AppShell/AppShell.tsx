"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Calendar } from "@/components/Calendar";
import { ConflictToast } from "@/components/ConflictToast";
import { CreateEventModal, type EventDraft } from "@/components/CreateEventModal";
import { Navbar } from "@/components/Navbar";
import { NotesApp, type NoteDraftContext } from "@/components/Notes";
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
import type { Note, NoteFolder, NotesFilter } from "@/lib/notes";
import { EMPTY_TIPTAP_DOC } from "@/lib/notes";
import type { CalendarEvent } from "@/lib/events";
import {
  conflictFingerprint,
  conflictingEventGroups,
} from "@/lib/scheduling";
import { colorForEvent, tagIdsForEvent, type EventTag, type Tag } from "@/lib/tags";
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
  const [noteFolders, setNoteFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesSearchQuery, setNotesSearchQuery] = useState("");
  const [notesFilter, setNotesFilter] = useState<NotesFilter>({ type: "all" });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<Date>(() => startOfDay(new Date()));
  const [dismissedConflictFingerprint, setDismissedConflictFingerprint] = useState<string | null>(
    null,
  );
  const [hiddenHighlightFingerprint, setHiddenHighlightFingerprint] = useState<string | null>(
    null,
  );
  const [hiddenConflictKeys, setHiddenConflictKeys] = useState<Set<string>>(() => new Set());

  const supabase = useMemo(() => createClient(), []);
  const showRightPanel = screenView === "map";
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;

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

  const loadNotes = useCallback(
    async (groupId: string | null) => {
      if (!groupId) {
        setNoteFolders([]);
        setNotes([]);
        return;
      }

      const [foldersResult, notesResult] = await Promise.all([
        supabase
          .from("note_folders")
          .select("*")
          .eq("group_id", groupId)
          .order("sort_order", { ascending: true }),
        supabase
          .from("notes")
          .select("*")
          .eq("group_id", groupId)
          .order("updated_at", { ascending: false }),
      ]);

      if (foldersResult.error) {
        console.error("loadNoteFolders", foldersResult.error);
      } else {
        setNoteFolders(foldersResult.data ?? []);
      }

      if (notesResult.error) {
        console.error("loadNotes", notesResult.error);
      } else {
        setNotes(notesResult.data ?? []);
      }
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroups([]);
      setActiveGroupId(null);
      setEvents([]);
      setTags([]);
      setEventTags([]);
      setNoteFolders([]);
      setNotes([]);
      return;
    }
    void loadGroups();
  }, [user, loadGroups]);

  useEffect(() => {
    if (activeGroupId) {
      window.localStorage.setItem(ACTIVE_GROUP_KEY, activeGroupId);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEvents(activeGroupId);
    void loadTags(activeGroupId);
    void loadEventTags(activeGroupId);
    void loadNotes(activeGroupId);
  }, [activeGroupId, loadEvents, loadTags, loadEventTags, loadNotes]);

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
        { event: "*", schema: "public", table: "note_folders", filter: `group_id=eq.${activeGroupId}` },
        () => { void loadNotes(activeGroupId); },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `group_id=eq.${activeGroupId}` },
        () => { void loadNotes(activeGroupId); },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [activeGroupId, loadEvents, loadTags, loadEventTags, loadNotes, supabase]);

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

    // Tag filter - if any tags active, only show events that have at least one
    if (activeTagIds.length > 0) {
      filtered = filtered.filter((event) => {
        const ids = tagIdsForEvent(event.id, eventTags);
        return ids.some((id) => activeTagIds.includes(id));
      });
    }

    return filtered;
  }, [events, searchQuery, activeTagIds, eventTags]);

  const conflictGroups = useMemo(() => conflictingEventGroups(events), [events]);
  const conflictFp = useMemo(
    () => conflictFingerprint(conflictGroups.map((g) => g.key)),
    [conflictGroups],
  );
  const conflictToastItems = useMemo(
    () =>
      conflictGroups.map((group) => {
        const firstId = group.eventIds[0]!;
        return {
          key: group.key,
          title: group.title,
          color: colorForEvent(firstId, eventTags, tags) ?? "#6366f1",
        };
      }),
    [conflictGroups, eventTags, tags],
  );

  const conflictToastOpen =
    conflictGroups.length > 0 && dismissedConflictFingerprint !== conflictFp;

  const highlightConflictIds = useMemo(() => {
    if (conflictGroups.length === 0) return new Set<string>();
    if (hiddenHighlightFingerprint === conflictFp) return new Set<string>();
    const ids = new Set<string>();
    for (const group of conflictGroups) {
      if (hiddenConflictKeys.has(group.key)) continue;
      for (const id of group.eventIds) ids.add(id);
    }
    return ids;
  }, [conflictGroups, conflictFp, hiddenHighlightFingerprint, hiddenConflictKeys]);

  const showConflictHighlights = highlightConflictIds.size > 0;

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

  async function handleCreateMultipleEvents(drafts: EventDraft[], explicitRecurrenceGroupId?: string) {
    if (!user || !activeGroupId) {
      throw new Error("Join or create a shared workspace first.");
    }
    if (drafts.length === 0) return;

    const recurrenceGroupId = explicitRecurrenceGroupId || crypto.randomUUID();

    // 1. Bulk insert events
    const { data: insertedEvents, error: eventsError } = await supabase
      .from("events")
      .insert(
        drafts.map((input) => ({
          group_id: activeGroupId,
          title: input.title,
          description: input.description || null,
          starts_at: input.startsAt.toISOString(),
          ends_at: input.endsAt.toISOString(),
          created_by: user.id,
          recurrence_group_id: drafts.length > 1 ? recurrenceGroupId : null,
        }))
      )
      .select("id");

    if (eventsError) {
      throw new Error(eventsError.message);
    }

    // 2. Bulk insert tags for all events
    const tagInserts: { event_id: string; tag_id: string }[] = [];
    if (insertedEvents) {
      insertedEvents.forEach((ev, idx) => {
        const input = drafts[idx];
        if (input && input.tagIds.length > 0) {
          input.tagIds.forEach((tagId) => {
            tagInserts.push({ event_id: ev.id, tag_id: tagId });
          });
        }
      });
    }

    if (tagInserts.length > 0) {
      const { error: tagError } = await supabase.from("event_tags").insert(tagInserts);
      if (tagError) throw new Error(tagError.message);
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
    await loadEvents(activeGroupId);
    await loadEventTags(activeGroupId);
  }

  async function handleUpdateSeries(recurrenceGroupId: string, drafts: EventDraft[]) {
    if (!activeGroupId) throw new Error("Join or create a shared workspace first.");

    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("recurrence_group_id", recurrenceGroupId);

    if (deleteError) throw new Error(deleteError.message);

    await handleCreateMultipleEvents(drafts, recurrenceGroupId);
  }

  async function handleDeleteSeries(recurrenceGroupId: string) {
    const { error } = await supabase.from("events").delete().eq("recurrence_group_id", recurrenceGroupId);
    if (error) throw new Error(error.message);
    await loadEvents(activeGroupId);
    await loadEventTags(activeGroupId);
  }

  function openCreateModal(date?: Date) {
    setSelectedEvent(null);
    setModalDefaultDate(date instanceof Date ? date : viewDate);
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

  async function handleCreateNote(context?: NoteDraftContext): Promise<string | null> {
    if (!user || !activeGroupId) {
      throw new Error("Join or create a shared workspace first.");
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        group_id: activeGroupId,
        folder_id: context?.folderId ?? null,
        event_id: context?.eventId ?? null,
        linked_date: context?.linkedDate ?? null,
        visibility: context?.visibility ?? "shared",
        title: "",
        content: EMPTY_TIPTAP_DOC,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    await loadNotes(activeGroupId);
    return data?.id ?? null;
  }

  async function handleUpdateNote(
    noteId: string,
    patch: Partial<
      Pick<
        Note,
        | "title"
        | "content"
        | "folder_id"
        | "event_id"
        | "linked_date"
        | "visibility"
        | "is_pinned"
      >
    >,
  ) {
    const { error } = await supabase.from("notes").update(patch).eq("id", noteId);
    if (error) throw new Error(error.message);
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, ...patch, updated_at: new Date().toISOString() } : note)),
    );
  }

  async function handleDeleteNote(noteId: string) {
    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) throw new Error(error.message);
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
    if (selectedNoteId === noteId) setSelectedNoteId(null);
  }

  async function handleCreateNoteFolder(name: string, visibility: "shared" | "private") {
    if (!user || !activeGroupId) throw new Error("Join or create a workspace first.");
    const { error } = await supabase.from("note_folders").insert({
      group_id: activeGroupId,
      name,
      visibility,
      created_by: user.id,
      sort_order: noteFolders.filter((f) => f.visibility === visibility).length,
    });
    if (error) throw new Error(error.message);
    await loadNotes(activeGroupId);
  }

  async function handleDeleteNoteFolder(folderId: string) {
    const { error } = await supabase.from("note_folders").delete().eq("id", folderId);
    if (error) throw new Error(error.message);
    await loadNotes(activeGroupId);
  }

  async function handleRenameNoteFolder(folderId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Folder name cannot be empty.");
    const { error } = await supabase.from("note_folders").update({ name: trimmed }).eq("id", folderId);
    if (error) throw new Error(error.message);
    setNoteFolders((prev) =>
      prev.map((folder) => (folder.id === folderId ? { ...folder, name: trimmed } : folder)),
    );
  }

  function openNotesForEvent(noteId: string) {
    setScreenView("notes");
    setNotesFilter({ type: "event", eventId: selectedEvent!.id });
    setSelectedNoteId(noteId);
    closeEventModal();
  }

  async function handleCreateNoteForEvent(eventId: string) {
    const id = await handleCreateNote({ eventId, visibility: "shared" });
    if (id) {
      setScreenView("notes");
      setNotesFilter({ type: "event", eventId });
      setSelectedNoteId(id);
      closeEventModal();
    }
  }

  const eventLinkedNotes = selectedEvent
    ? notes.filter((n) => n.event_id === selectedEvent.id)
    : [];

  const userInitials = getInitials(
    (user?.user_metadata?.display_name as string | undefined) || user?.email,
  );

  // Tag IDs on the currently-selected event (for the modal)
  const selectedEventTagIds = selectedEvent
    ? tagIdsForEvent(selectedEvent.id, eventTags)
    : [];

  const seriesEvents = selectedEvent?.recurrence_group_id
    ? events.filter((e) => e.recurrence_group_id === selectedEvent.recurrence_group_id)
    : selectedEvent
      ? [selectedEvent]
      : [];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Navbar
        monthLabel={formatViewLabel(viewDate, calendarMode)}
        calendarMode={calendarMode}
        screenView={screenView}
        sidebarOpen={sidebarOpen}
        searchQuery={screenView === "notes" ? notesSearchQuery : searchQuery}
        userInitials={userInitials}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onToday={() => setViewDate(startOfDay(new Date()))}
        onPrev={() => setViewDate((d) => shiftViewDate(d, calendarMode, -1))}
        onNext={() => setViewDate((d) => shiftViewDate(d, calendarMode, 1))}
        onCalendarModeChange={setCalendarMode}
        onScreenViewChange={setScreenView}
        onSearchChange={screenView === "notes" ? setNotesSearchQuery : setSearchQuery}
      />

      <div className="flex min-h-0 flex-1">
        {screenView === "calendar" && (
          <Sidebar
            open={sidebarOpen}
            viewDate={viewDate}
            activeTagIds={activeTagIds}
            onCreateEvent={() => openCreateModal()}
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
        )}

        {screenView === "notes" ? (
          <NotesApp
            groupId={activeGroupId}
            groupName={activeGroup?.name ?? null}
            groups={groups}
            onSelectGroup={setActiveGroupId}
            folders={noteFolders}
            notes={notes}
            events={events}
            searchQuery={notesSearchQuery}
            filter={notesFilter}
            selectedNoteId={selectedNoteId}
            onFilterChange={setNotesFilter}
            onSelectNote={setSelectedNoteId}
            onSearchChange={setNotesSearchQuery}
            onCreateNote={handleCreateNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onCreateFolder={handleCreateNoteFolder}
            onDeleteFolder={handleDeleteNoteFolder}
            onRenameFolder={handleRenameNoteFolder}
          />
        ) : (
          <>
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
                conflictIds={highlightConflictIds}
                showConflictHighlights={showConflictHighlights}
                onViewDateChange={setViewDate}
                onCalendarModeChange={setCalendarMode}
                onSelectEvent={openEventDetails}
                onDayDoubleClick={openCreateModal}
              />
            </main>

            <RightPanel visible={showRightPanel} />
          </>
        )}
      </div>

      <ConflictToast
        open={conflictToastOpen}
        items={conflictToastItems}
        hiddenKeys={hiddenConflictKeys}
        onDismiss={() => setDismissedConflictFingerprint(conflictFp)}
        onHideHighlights={() => {
          setDismissedConflictFingerprint(conflictFp);
          setHiddenHighlightFingerprint(conflictFp);
        }}
        onToggleHidden={(key) => {
          setHiddenConflictKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          });
          // Re-enable highlights if user was in "hide all" mode
          setHiddenHighlightFingerprint((fp) => (fp === conflictFp ? null : fp));
        }}
        onSetHiddenKeys={(keys) => {
          setHiddenConflictKeys(keys);
          setHiddenHighlightFingerprint((fp) => (fp === conflictFp ? null : fp));
        }}
      />

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
        seriesEvents={seriesEvents}
        existingEvents={events}
        tags={tags}
        initialTagIds={selectedEventTagIds}
        onClose={closeEventModal}
        onCreate={handleCreateEvent}
        onCreateMultiple={handleCreateMultipleEvents}
        onUpdate={handleUpdateEvent}
        onUpdateSeries={handleUpdateSeries}
        onDelete={handleDeleteEvent}
        onDeleteSeries={handleDeleteSeries}
        onCreateTag={handleCreateTag}
        linkedNotes={eventLinkedNotes}
        onOpenNote={openNotesForEvent}
        onCreateNoteForEvent={handleCreateNoteForEvent}
      />
    </div>
  );
}
