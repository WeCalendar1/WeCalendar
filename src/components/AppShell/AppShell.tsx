"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "@/lib/theme";
import type { User } from "@supabase/supabase-js";
import { Calendar } from "@/components/Calendar";
import { ConflictToast } from "@/components/ConflictToast";
import { CreateEventModal, type EventDraft } from "@/components/CreateEventModal";
import { EventViewerPanel } from "@/components/EventViewerPanel";
import { Navbar } from "@/components/Navbar";
import { MapApp } from "@/components/Map/MapApp";
import { NotesApp, type NoteDraftContext } from "@/components/Notes";
import { PanelResizeHandle, usePanelWidth } from "@/components/PanelResizeHandle";
import { Sidebar } from "@/components/Sidebar";
import { getInitials } from "@/lib/auth";
import {
  formatViewLabel,
  isDateInView,
  shiftViewDate,
  startOfDay,
  type CalendarMode,
  type ScreenView,
} from "@/lib/calendar";
import type { Note, NoteFolder, NotesFilter } from "@/lib/notes";
import { EMPTY_TIPTAP_DOC, isEmptyNotePatch, normalizeFolderColor, canMoveNoteToFolder, filterNotesByTags } from "@/lib/notes";
import {
  executeSeriesReconciliation,
  prepareBulkEventInserts,
  reconcileSeriesUpdate,
  type CalendarEvent,
} from "@/lib/events";
import {
  isMissingColumnOrRelationError,
  resolveNotificationNavigation,
  type AppNotification,
} from "@/lib/notifications";
import {
  filterConflictCandidateEvents,
  filterVisibleEvents,
  rsvpMapForUser,
  type EventRsvp,
  type RsvpStatus,
} from "@/lib/rsvps";
import {
  conflictFingerprint,
  conflictingEventGroups,
} from "@/lib/scheduling";
import { colorForEvent, tagIdsForEvent, type EventTag, type Tag } from "@/lib/tags";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Json } from "@/types/database";
import { useCalendarPrefs } from "@/lib/calendarPrefs";
import type { Place, PlaceKind } from "@/lib/places";

type Group = Tables<"groups">;
type EventCreator = NonNullable<CalendarEvent["creator"]>;

const ACTIVE_GROUP_KEY = "wecalendar.activeGroupId";
const emptySubscribe = () => () => {};

export function AppShell() {
  const { mode: themeMode, accent, toggleMode: toggleTheme, setAccentColor } = useTheme();
  const { prefs } = useCalendarPrefs();
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [viewDate, setViewDate] = useState(() => startOfDay(new Date()));
  const [calendarMode, setCalendarMode] = useState<CalendarMode>(prefs.defaultView);
  const [didInitDefaultView, setDidInitDefaultView] = useState(false);
  if (isHydrated && !didInitDefaultView) {
    setDidInitDefaultView(true);
    if (calendarMode !== prefs.defaultView) {
      setCalendarMode(prefs.defaultView);
    }
  }
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [workspaceModalRequestKey, setWorkspaceModalRequestKey] = useState(0);
  const [screenView, setScreenView] = useState<ScreenView>("calendar");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [eventViewerOpen, setEventViewerOpen] = useState(false);
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [todayJumpKey, setTodayJumpKey] = useState(0);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventRsvps, setEventRsvps] = useState<EventRsvp[]>([]);
  const [groupProfilesById, setGroupProfilesById] = useState<
    Map<string, { display_name: string | null; avatar_url: string | null }>
  >(() => new Map());
  const [tags, setTags] = useState<Tag[]>([]);
  const [eventTags, setEventTags] = useState<EventTag[]>([]);
  const [noteFolders, setNoteFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [notesSearchQuery, setNotesSearchQuery] = useState("");
  const [notesFilter, setNotesFilter] = useState<NotesFilter>({ type: "all" });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<Date>(() => startOfDay(new Date()));
  const [modalDefaultPlaceId, setModalDefaultPlaceId] = useState<string | null>(null);
  const [dismissedConflictFingerprint, setDismissedConflictFingerprint] = useState<string | null>(
    null,
  );
  const [hiddenHighlightFingerprint, setHiddenHighlightFingerprint] = useState<string | null>(
    null,
  );
  const [hiddenConflictKeys, setHiddenConflictKeys] = useState<Set<string>>(() => new Set());
  const [draggingNoteIds, setDraggingNoteIds] = useState<string[]>([]);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const { width: panelWidth, setWidth: setPanelWidth } = usePanelWidth();
  const [panelResizing, setPanelResizing] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const selectedNoteIdRef = useRef<string | null>(null);
  const pendingOpenEventRef = useRef<{ groupId: string; eventId: string } | null>(null);
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;

  useEffect(() => {
    selectedNoteIdRef.current = selectedNoteId;
  }, [selectedNoteId]);

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

      const { data: eventData, error } = await supabase
        .from("events")
        .select("*")
        .eq("group_id", groupId)
        .order("starts_at", { ascending: true });

      if (error) {
        console.error("loadEvents", error);
        return;
      }

      const creatorIds = [
        ...new Set(
          (eventData ?? [])
            .map((event) => event.created_by)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const creatorsById = new Map<string, EventCreator>();

      if (creatorIds.length > 0) {
        const { data: profilesWithAvatars, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, theme_preferences")
          .in("id", creatorIds);

        if (profileError) {
          // Existing deployments can load events before the avatar migration is applied.
          const { data: profiles, error: fallbackError } = await supabase
            .from("profiles")
            .select("id, display_name, theme_preferences")
            .in("id", creatorIds);

          if (fallbackError) {
            console.warn("loadEventCreators", fallbackError);
          } else {
            (profiles ?? []).forEach((profile) => {
              creatorsById.set(profile.id, { ...profile, avatar_url: null });
            });
          }
        } else {
          (profilesWithAvatars ?? []).forEach((profile) => {
            creatorsById.set(profile.id, profile);
          });
        }
      }

      const nextEvents: CalendarEvent[] = (eventData ?? []).map((event) => ({
        ...event,
        creator: event.created_by ? (creatorsById.get(event.created_by) ?? null) : null,
      }));
      setEvents(nextEvents);
      const pendingOpen = pendingOpenEventRef.current;
      if (pendingOpen && pendingOpen.groupId === groupId) {
        pendingOpenEventRef.current = null;
        const target = nextEvents.find((event) => event.id === pendingOpen.eventId) ?? null;
        if (target) {
          setViewDate(startOfDay(new Date(target.starts_at)));
          setSelectedEvent(target);
          setModalOpen(true);
          return;
        }
      }
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

  const loadEventRsvps = useCallback(
    async (groupId: string | null) => {
      if (!groupId) {
        setEventRsvps([]);
        return;
      }
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("event_id, group_id, user_id, status, updated_at")
        .eq("group_id", groupId);

      if (error) {
        console.warn("loadEventRsvps", error);
        setEventRsvps([]);
        return;
      }
      setEventRsvps(data ?? []);
    },
    [supabase],
  );

  const loadGroupProfiles = useCallback(
    async (groupId: string | null) => {
      if (!groupId) {
        setGroupProfilesById(new Map());
        return;
      }
      const { data: memberRows, error: memberError } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      if (memberError) {
        console.warn("loadGroupProfiles.members", memberError);
        setGroupProfilesById(new Map());
        return;
      }

      const userIds = [...new Set((memberRows ?? []).map((row) => row.user_id))];
      if (userIds.length === 0) {
        setGroupProfilesById(new Map());
        return;
      }

      const nextMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      const { data: profilesWithAvatars, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      if (profileError) {
        const { data: fallbackProfiles, error: fallbackError } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);
        if (fallbackError) {
          console.warn("loadGroupProfiles.profiles", fallbackError);
        } else {
          (fallbackProfiles ?? []).forEach((p) => {
            nextMap.set(p.id, { display_name: p.display_name, avatar_url: null });
          });
        }
      } else {
        (profilesWithAvatars ?? []).forEach((p) => {
          nextMap.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
        });
      }
      setGroupProfilesById(nextMap);
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
        const incoming = notesResult.data ?? [];
        setNotes((prev) => {
          const activeId = selectedNoteIdRef.current;
          if (!activeId) return incoming;
          const local = prev.find((note) => note.id === activeId);
          if (!local) return incoming;
          return incoming.map((note) =>
            note.id === activeId
              ? { ...note, title: local.title, content: local.content }
              : note,
          );
        });
      }
    },
    [supabase],
  );

  const loadNotifications = useCallback(
    async (userId: string | null) => {
      if (!userId) {
        setNotifications([]);
        return;
      }
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        if (!isMissingColumnOrRelationError(error)) {
          console.warn("loadNotifications", error);
        }
        setNotifications([]);
        return;
      }
      setNotifications(data ?? []);
    },
    [supabase],
  );

  const loadPlaces = useCallback(
    async (groupId: string | null) => {
      if (!groupId) {
        setPlaces([]);
        return;
      }
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("group_id", groupId)
        .order("name", { ascending: true });
      if (error) {
        console.warn("loadPlaces", error);
        setPlaces([]);
        return;
      }
      setPlaces(data ?? []);
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
      setEventRsvps([]);
      setGroupProfilesById(new Map());
      setTags([]);
      setEventTags([]);
      setNoteFolders([]);
      setNotes([]);
      setNotifications([]);
      setPlaces([]);
      pendingOpenEventRef.current = null;
      setUserAvatarUrl(null);
      setProfileDisplayName(null);
      return;
    }
    void loadGroups();
    void loadNotifications(user.id);
    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        const { data: fallback } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();
        if (!active) return;
        setProfileDisplayName(fallback?.display_name ?? null);
        setUserAvatarUrl(null);
        return;
      }
      setProfileDisplayName(data?.display_name ?? null);
      setUserAvatarUrl(data?.avatar_url ?? null);
    })();
    return () => {
      active = false;
    };
  }, [user, loadGroups, loadNotifications, supabase]);

  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;

    const channel = supabase
      .channel(`user-notifications:${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${uid}` },
        () => { void loadNotifications(uid); },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [user?.id, loadNotifications, supabase]);

  useEffect(() => {
    if (activeGroupId) {
      window.localStorage.setItem(ACTIVE_GROUP_KEY, activeGroupId);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEvents(activeGroupId);
    void loadTags(activeGroupId);
    void loadEventTags(activeGroupId);
    void loadEventRsvps(activeGroupId);
    void loadGroupProfiles(activeGroupId);
    void loadNotes(activeGroupId);
    void loadPlaces(activeGroupId);
  }, [
    activeGroupId,
    loadEvents,
    loadTags,
    loadEventTags,
    loadEventRsvps,
    loadGroupProfiles,
    loadNotes,
    loadPlaces,
  ]);

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
        { event: "*", schema: "public", table: "event_rsvps", filter: `group_id=eq.${activeGroupId}` },
        () => { void loadEventRsvps(activeGroupId); },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${activeGroupId}` },
        () => { void loadGroupProfiles(activeGroupId); },
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "places", filter: `group_id=eq.${activeGroupId}` },
        () => { void loadPlaces(activeGroupId); },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [
    activeGroupId,
    loadEvents,
    loadTags,
    loadEventTags,
    loadEventRsvps,
    loadGroupProfiles,
    loadNotes,
    loadPlaces,
    supabase,
  ]);

  // ─── Filtered events ──────────────────────────────────────────────────────

  const myRsvpByEventId = useMemo(
    () => rsvpMapForUser(eventRsvps, user?.id),
    [eventRsvps, user?.id],
  );

  const eventsWithRsvp = useMemo(
    () => events.map((e) => ({ ...e, myRsvp: myRsvpByEventId.get(e.id) ?? null })),
    [events, myRsvpByEventId],
  );

  const filteredEvents = useMemo(() => {
    let filtered = filterVisibleEvents(eventsWithRsvp, prefs.showDeclinedEvents);

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
  }, [eventsWithRsvp, prefs.showDeclinedEvents, searchQuery, activeTagIds, eventTags]);

  // Filter notes by active tags (via linked event's tags)
  const filteredNotes = useMemo(
    () => filterNotesByTags(notes, activeTagIds, eventTags),
    [notes, activeTagIds, eventTags],
  );

  const conflictGroups = useMemo(() => {
    return conflictingEventGroups(
      filterConflictCandidateEvents(eventsWithRsvp, {
        hidePastConflicts: prefs.hidePastConflicts,
      }),
    );
  }, [eventsWithRsvp, prefs.hidePastConflicts]);
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

  async function handleUpdateTag(tagId: string, name: string, color: string) {
    if (!activeGroupId) throw new Error("Join or create a calendar first.");
    const { error } = await supabase.from("tags").update({ name, color }).eq("id", tagId);
    if (error) throw new Error(error.message);
    await loadTags(activeGroupId);
  }

  async function handleDeleteTag(tagId: string) {
    if (!activeGroupId) throw new Error("Join or create a calendar first.");
    const { error } = await supabase.from("tags").delete().eq("id", tagId);
    if (error) throw new Error(error.message);
    setActiveTagIds((prev) => prev.filter((id) => id !== tagId));
    await Promise.all([loadTags(activeGroupId), loadEventTags(activeGroupId)]);
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
        place_id: input.placeId ?? null,
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

    const { eventRows, tagRows } = prepareBulkEventInserts(drafts, {
      groupId: activeGroupId,
      userId: user.id,
      recurrenceGroupId: explicitRecurrenceGroupId,
    });

    const { error: eventsError } = await supabase.from("events").insert(eventRows);
    if (eventsError) {
      throw new Error(eventsError.message);
    }

    if (tagRows.length > 0) {
      const { error: tagError } = await supabase.from("event_tags").insert(tagRows);
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
        place_id: input.placeId ?? null,
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

    await Promise.all([
      loadEvents(activeGroupId),
      loadEventTags(activeGroupId),
      loadEventRsvps(activeGroupId),
    ]);
  }

  async function handleDeleteEvent(eventId: string) {
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) throw new Error(error.message);
    await Promise.all([
      loadEvents(activeGroupId),
      loadEventTags(activeGroupId),
      loadEventRsvps(activeGroupId),
    ]);
  }

  async function handleUpdateSeries(recurrenceGroupId: string, drafts: EventDraft[]) {
    if (!user || !activeGroupId) throw new Error("Join or create a shared workspace first.");

    const existingSeries = events.filter((e) => e.recurrence_group_id === recurrenceGroupId);
    const plan = reconcileSeriesUpdate(existingSeries, drafts, {
      groupId: activeGroupId,
      userId: user.id,
      recurrenceGroupId,
    });

    await executeSeriesReconciliation(plan, {
      updateEvent: async (id, patch) => {
        const { error } = await supabase.from("events").update(patch).eq("id", id);
        if (error) throw new Error(error.message);
      },
      replaceUpdatedEventTags: async (eventIds, tagRows) => {
        const { error: delTagError } = await supabase
          .from("event_tags")
          .delete()
          .in("event_id", eventIds);
        if (delTagError) throw new Error(delTagError.message);

        if (tagRows.length > 0) {
          const { error: insTagError } = await supabase.from("event_tags").insert(tagRows);
          if (insTagError) throw new Error(insTagError.message);
        }
      },
      deleteEvents: async (ids) => {
        const { error } = await supabase.from("events").delete().in("id", ids);
        if (error) throw new Error(error.message);
      },
      insertEvents: async (eventRows, tagRows) => {
        const { error: insertError } = await supabase.from("events").insert(eventRows);
        if (insertError) throw new Error(insertError.message);

        if (tagRows.length > 0) {
          const { error: insertTagError } = await supabase.from("event_tags").insert(tagRows);
          if (insertTagError) throw new Error(insertTagError.message);
        }
      },
      reload: async () => {
        await Promise.all([
          loadEvents(activeGroupId),
          loadEventTags(activeGroupId),
          loadEventRsvps(activeGroupId),
        ]);
      },
    });
  }

  async function handleDeleteSeries(recurrenceGroupId: string) {
    const { error } = await supabase.from("events").delete().eq("recurrence_group_id", recurrenceGroupId);
    if (error) throw new Error(error.message);
    await Promise.all([
      loadEvents(activeGroupId),
      loadEventTags(activeGroupId),
      loadEventRsvps(activeGroupId),
    ]);
  }

  async function handleSetEventRsvp(targetEventIds: string[], status: RsvpStatus | null) {
    if (!user || !activeGroupId || targetEventIds.length === 0) return;

    const uniqueIds = [...new Set(targetEventIds)];
    const targetSet = new Set(uniqueIds);
    const nowIso = new Date().toISOString();

    setEventRsvps((prev) => {
      const kept = prev.filter(
        (row) => !(row.user_id === user.id && targetSet.has(row.event_id)),
      );
      if (status === null) return kept;
      return [
        ...kept,
        ...uniqueIds.map((eventId) => ({
          event_id: eventId,
          group_id: activeGroupId,
          user_id: user.id,
          status,
          updated_at: nowIso,
        })),
      ];
    });

    if (status === null) {
      const { error } = await supabase
        .from("event_rsvps")
        .delete()
        .eq("user_id", user.id)
        .in("event_id", uniqueIds);
      if (error) {
        await loadEventRsvps(activeGroupId);
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase.from("event_rsvps").upsert(
        uniqueIds.map((eventId) => ({
          event_id: eventId,
          group_id: activeGroupId,
          user_id: user.id,
          status,
          updated_at: nowIso,
        })),
        { onConflict: "event_id,user_id" },
      );
      if (error) {
        await loadEventRsvps(activeGroupId);
        throw new Error(error.message);
      }
    }
  }

  async function handleMarkNotificationRead(notificationId: string) {
    if (!user) return;
    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId && !item.read_at ? { ...item, read_at: nowIso } : item,
      ),
    );
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: nowIso })
      .eq("id", notificationId)
      .eq("recipient_id", user.id);
    if (error && !isMissingColumnOrRelationError(error)) {
      console.warn("handleMarkNotificationRead", error);
      await loadNotifications(user.id);
    }
  }

  async function handleMarkAllNotificationsRead() {
    if (!user) return;
    if (!notifications.some((item) => !item.read_at)) return;
    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((item) => (item.read_at ? item : { ...item, read_at: nowIso })),
    );
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: nowIso })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    if (error && !isMissingColumnOrRelationError(error)) {
      console.warn("handleMarkAllNotificationsRead", error);
      await loadNotifications(user.id);
    }
  }

  async function handleDismissNotification(notificationId: string) {
    if (!user) return;
    setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("recipient_id", user.id);
    if (error && !isMissingColumnOrRelationError(error)) {
      console.warn("handleDismissNotification", error);
      await loadNotifications(user.id);
    }
  }

  async function handleClearNotifications() {
    if (!user || notifications.length === 0) return;
    setNotifications([]);
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("recipient_id", user.id);
    if (error && !isMissingColumnOrRelationError(error)) {
      console.warn("handleClearNotifications", error);
      await loadNotifications(user.id);
    }
  }

  function handleSelectNotification(notification: AppNotification) {
    if (!notification.read_at) {
      void handleMarkNotificationRead(notification.id);
    }

    const nav = resolveNotificationNavigation(notification, {
      activeGroupId,
      memberGroupIds: groups.map((g) => g.id),
      loadedEventIds: eventsWithRsvp.map((e) => e.id),
    });
    if (!nav) return;

    if (nav.switchToGroupId) {
      setActiveTagIds([]);
      setActiveGroupId(nav.switchToGroupId);
    }

    if (nav.screenView === "notes" && nav.noteId) {
      closeEventModal();
      setScreenView("notes");
      setNotesFilter({ type: "all" });
      setNotesSearchQuery("");
      setSelectedNoteId(nav.noteId);
      if (!nav.switchToGroupId && activeGroupId && !notes.some((n) => n.id === nav.noteId)) {
        void loadNotes(activeGroupId);
      }
      return;
    }

    setScreenView("calendar");
    if (nav.eventId) {
      if (nav.deferEventOpenForGroupId) {
        pendingOpenEventRef.current = {
          groupId: nav.deferEventOpenForGroupId,
          eventId: nav.eventId,
        };
        if (nav.reloadEventsForGroupId) {
          void Promise.all([
            loadEvents(nav.reloadEventsForGroupId),
            loadEventTags(nav.reloadEventsForGroupId),
            loadEventRsvps(nav.reloadEventsForGroupId),
          ]);
        }
      } else {
        const matched = eventsWithRsvp.find((event) => event.id === nav.eventId) ?? null;
        if (matched) {
          setViewDate(startOfDay(new Date(matched.starts_at)));
          openEventDetails(matched);
        }
      }
    } else if (nav.switchToGroupId) {
      closeEventModal();
    }
  }

  async function handleNudgeUnanswered(eventId: string): Promise<number> {
    if (!user || !activeGroupId) {
      throw new Error("Join or create a shared workspace first.");
    }
    const { data, error } = await supabase.rpc("send_availability_nudge", {
      p_group_id: activeGroupId,
      p_event_id: eventId,
    });
    if (error) throw new Error(error.message);
    return data ?? 0;
  }

  async function handleNudgeGroupAvailability(): Promise<number> {
    if (!user || !activeGroupId) {
      throw new Error("Join or create a shared workspace first.");
    }
    const { data, error } = await supabase.rpc("send_availability_nudge", {
      p_group_id: activeGroupId,
    });
    if (error) throw new Error(error.message);
    return data ?? 0;
  }

  async function handleCreatePlace(input: {
    name: string;
    address: string | null;
    lat: number;
    lng: number;
    kind: PlaceKind;
  }) {
    if (!user || !activeGroupId) throw new Error("Join or create a shared workspace first.");
    const { error } = await supabase.from("places").insert({
      group_id: activeGroupId,
      name: input.name,
      address: input.address,
      lat: input.lat,
      lng: input.lng,
      kind: input.kind,
      created_by: user.id,
    });
    if (error) throw new Error(error.message);
    await loadPlaces(activeGroupId);
  }

  async function handleUpdatePlace(placeId: string, patch: { name?: string; kind?: PlaceKind }) {
    const { error } = await supabase.from("places").update(patch).eq("id", placeId);
    if (error) throw new Error(error.message);
    await loadPlaces(activeGroupId);
  }

  async function handleDeletePlace(placeId: string) {
    const { error } = await supabase.from("places").delete().eq("id", placeId);
    if (error) throw new Error(error.message);
    await loadPlaces(activeGroupId);
  }

  function openCreateModal(date?: Date, placeId?: string | null) {
    setSelectedEvent(null);
    setModalDefaultDate(date instanceof Date ? date : viewDate);
    setModalDefaultPlaceId(placeId ?? null);
    setModalOpen(true);
  }

  function openEventDetails(event: CalendarEvent) {
    setSelectedEvent(event);
    setModalOpen(true);
  }

  function closeEventModal() {
    setModalOpen(false);
    setSelectedEvent(null);
    setModalDefaultPlaceId(null);
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
        place_id: context?.placeId ?? null,
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

  function applyNotePatchLocally(
    noteId: string,
    patch: Partial<
      Pick<
        Note,
        | "title"
        | "content"
        | "folder_id"
        | "event_id"
        | "place_id"
        | "linked_date"
        | "visibility"
        | "is_pinned"
        | "updated_at"
      >
    >,
    bumpUpdatedAt: boolean,
  ) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId
          ? {
              ...note,
              ...patch,
              ...(bumpUpdatedAt ? { updated_at: new Date().toISOString() } : {}),
            }
          : note,
      ),
    );
  }

  function handleNoteDraftChange(
    noteId: string,
    patch: { title?: string; content?: Json },
  ) {
    // Draft edits should not bump updated_at — only persisted saves reorder the list.
    applyNotePatchLocally(noteId, patch, false);
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
        | "place_id"
        | "linked_date"
        | "visibility"
        | "is_pinned"
      >
    >,
  ) {
    if (isEmptyNotePatch(patch)) return;

    if (!notes.some((note) => note.id === noteId)) return;

    // Apply draft fields immediately; updated_at comes from the DB after save.
    applyNotePatchLocally(noteId, patch, false);

    const { data, error } = await supabase
      .from("notes")
      .update(patch)
      .eq("id", noteId)
      .select("updated_at")
      .single();

    if (error) {
      console.error("handleUpdateNote", error);
      if (activeGroupId) await loadNotes(activeGroupId);
      throw new Error(error.message);
    }

    if (data?.updated_at) {
      applyNotePatchLocally(noteId, { updated_at: data.updated_at }, false);
    }
  }

  function handleNotesFilterChange(newFilter: NotesFilter) {
    if (newFilter.type === "trash" || notesFilter.type === "trash") {
      setSelectedNoteId(null);
    }
    setNotesFilter(newFilter);
  }

  async function handleDeleteNote(noteId: string) {
    const deleted_at = new Date().toISOString();
    const { error } = await supabase
      .from("notes")
      .update({ deleted_at })
      .eq("id", noteId);
    if (error) throw new Error(error.message);
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, deleted_at } : note)),
    );
    if (selectedNoteId === noteId) setSelectedNoteId(null);
  }

  async function handleRestoreNote(noteId: string) {
    const { error } = await supabase
      .from("notes")
      .update({ deleted_at: null })
      .eq("id", noteId);
    if (error) throw new Error(error.message);
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, deleted_at: null } : note)),
    );
  }

  async function handlePermanentlyDeleteNote(noteId: string) {
    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) throw new Error(error.message);
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
    if (selectedNoteId === noteId) setSelectedNoteId(null);
  }

  async function handleEmptyTrash() {
    if (!activeGroupId) return;
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("group_id", activeGroupId)
      .not("deleted_at", "is", null);
    if (error) throw new Error(error.message);
    setNotes((prev) => prev.filter((note) => !note.deleted_at));
    if (selectedNoteId) {
      const selected = notes.find((n) => n.id === selectedNoteId);
      if (selected?.deleted_at) setSelectedNoteId(null);
    }
  }

  async function handleCreateNoteFolder(
    name: string,
    visibility: "shared" | "private",
    color: string,
  ) {
    if (!user || !activeGroupId) throw new Error("Join or create a workspace first.");
    const { error } = await supabase.from("note_folders").insert({
      group_id: activeGroupId,
      name,
      visibility,
      color: normalizeFolderColor(color),
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

  async function handleUpdateNoteFolder(
    folderId: string,
    patch: { name: string; color: string },
  ) {
    const trimmed = patch.name.trim();
    if (!trimmed) throw new Error("Folder name cannot be empty.");
    const color = normalizeFolderColor(patch.color);
    const { error } = await supabase
      .from("note_folders")
      .update({ name: trimmed, color })
      .eq("id", folderId);
    if (error) throw new Error(error.message);
    setNoteFolders((prev) =>
      prev.map((folder) =>
        folder.id === folderId ? { ...folder, name: trimmed, color } : folder,
      ),
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

  // ─── Note drag-drop handlers (lifted from NotesApp) ──────────────────────

  async function handleDropNoteOnFolder(folderId: string | null, noteIds: string[]) {
    if (noteIds.length === 0) return;
    for (const noteId of noteIds) {
      const note = notes.find((n) => n.id === noteId);
      if (!note) continue;
      if (folderId) {
        const folder = noteFolders.find((f) => f.id === folderId);
        if (!folder || !canMoveNoteToFolder(note, folder)) continue;
      }
      if (note.folder_id === folderId && !note.deleted_at) continue;
      if (note.deleted_at) await handleRestoreNote(noteId);
      if (note.folder_id !== folderId) await handleUpdateNote(noteId, { folder_id: folderId });
    }
    setDraggingNoteIds([]);
    setDragOverTarget(null);
  }

  async function handleDropNoteOnTrash(noteIds: string[]) {
    if (noteIds.length === 0) return;
    for (const noteId of noteIds) {
      await handleDeleteNote(noteId);
    }
    if (selectedNoteId && noteIds.includes(selectedNoteId)) {
      setSelectedNoteId(notes.find((note) => !noteIds.includes(note.id))?.id ?? null);
    }
    setDraggingNoteIds([]);
    setDragOverTarget(null);
  }

  const eventLinkedNotes = selectedEvent
    ? notes.filter((n) => n.event_id === selectedEvent.id)
    : [];

  const userInitials = getInitials(
    profileDisplayName || (user?.user_metadata?.display_name as string | undefined) || user?.email,
  );

  const activeSelectedEvent = useMemo(
    () =>
      selectedEvent
        ? eventsWithRsvp.find((e) => e.id === selectedEvent.id) ?? selectedEvent
        : null,
    [selectedEvent, eventsWithRsvp],
  );

  // Tag IDs on the currently-selected event (for the modal)
  const selectedEventTagIds = activeSelectedEvent
    ? tagIdsForEvent(activeSelectedEvent.id, eventTags)
    : [];

  const seriesEvents = activeSelectedEvent?.recurrence_group_id
    ? eventsWithRsvp.filter((e) => e.recurrence_group_id === activeSelectedEvent.recurrence_group_id)
    : activeSelectedEvent
      ? [activeSelectedEvent]
      : [];

  const consumeWorkspaceModalRequest = useCallback(() => {
    setWorkspaceModalRequestKey(0);
  }, []);

  const otherMemberCount = useMemo(() => {
    if (!user) return 0;
    let count = 0;
    for (const memberId of groupProfilesById.keys()) {
      if (memberId !== user.id) count += 1;
    }
    return count;
  }, [groupProfilesById, user]);

  function openWorkspaceOnboarding() {
    setSidebarOpen(true);
    setWorkspaceModalRequestKey((k) => k + 1);
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Navbar
        monthLabel={formatViewLabel(viewDate, calendarMode, prefs.weekStartsOnMonday)}
        calendarMode={calendarMode}
        screenView={screenView}
        sidebarOpen={sidebarOpen}
        searchQuery={screenView === "notes" ? notesSearchQuery : searchQuery}
        userInitials={userInitials}
        userAvatarUrl={userAvatarUrl}
        isDark={themeMode === "dark"}
        accent={accent}
        isTodayDisabled={isDateInView(startOfDay(new Date()), viewDate, calendarMode, prefs.weekStartsOnMonday)}
        onToggleSidebar={() => {
          if (sidebarOpen) setWorkspaceModalRequestKey(0);
          setSidebarOpen((open) => !open);
        }}
        onToday={() => {
          setViewDate(startOfDay(new Date()));
          setTodayJumpKey((k) => k + 1);
        }}
        onPrev={() => setViewDate((d) => shiftViewDate(d, calendarMode, -1))}
        onNext={() => setViewDate((d) => shiftViewDate(d, calendarMode, 1))}
        onCalendarModeChange={setCalendarMode}
        onScreenViewChange={setScreenView}
        onSearchChange={screenView === "notes" ? setNotesSearchQuery : setSearchQuery}
        onToggleTheme={toggleTheme}
        onSelectAccent={setAccentColor}
        eventViewerOpen={eventViewerOpen}
        onToggleEventViewer={() => setEventViewerOpen((v) => !v)}
        onCreateEvent={() => openCreateModal()}
        canCreateEvent={Boolean(activeGroupId)}
        notifications={notifications}
        onSelectNotification={handleSelectNotification}
        onMarkAllNotificationsRead={() => {
          void handleMarkAllNotificationsRead();
        }}
        onClearNotifications={() => {
          void handleClearNotifications();
        }}
        onDismissNotification={(notificationId) => {
          void handleDismissNotification(notificationId);
        }}
        conflictAlert={
          <ConflictToast
            open={conflictToastOpen && screenView === "calendar"}
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
              setHiddenHighlightFingerprint((fp) => (fp === conflictFp ? null : fp));
            }}
            onSetHiddenKeys={(keys) => {
              setHiddenConflictKeys(keys);
              setHiddenHighlightFingerprint((fp) => (fp === conflictFp ? null : fp));
            }}
          />
        }
      />

      <div
        className="flex min-h-0 flex-1"
        style={{
          transition:
            "transform var(--duration-base) var(--ease-out), filter var(--duration-base) var(--ease-out)",
          transform: modalOpen ? "scale(0.985) translateY(6px)" : "none",
          transformOrigin: "center 28%",
          filter: modalOpen ? "brightness(0.94) saturate(0.92)" : "none",
        }}
      >
        <Sidebar
          open={sidebarOpen}
          screenView={screenView}
          viewDate={viewDate}
          activeTagIds={activeTagIds}
          onTagToggle={handleTagToggle}
          tags={tags}
          onCreateTag={handleCreateTag}
          onUpdateTag={handleUpdateTag}
          onDeleteTag={handleDeleteTag}
          groups={groups}
          activeGroupId={activeGroupId}
          onSelectGroup={setActiveGroupId}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          otherMemberCount={otherMemberCount}
          onNudgeGroupAvailability={handleNudgeGroupAvailability}
          showWorkspace={prefs.showWorkspaceInSidebar || groups.length === 0}
          weekStartsOnMonday={prefs.weekStartsOnMonday}
          onSelectDate={setViewDate}
          workspaceModalRequestKey={workspaceModalRequestKey}
          onConsumeWorkspaceModalRequest={consumeWorkspaceModalRequest}
          notesFilter={notesFilter}
          noteFolders={noteFolders}
          onNotesFilterChange={handleNotesFilterChange}
          onCreateNoteFolder={handleCreateNoteFolder}
          onDeleteNoteFolder={handleDeleteNoteFolder}
          onUpdateNoteFolder={handleUpdateNoteFolder}
          draggingNoteIds={draggingNoteIds}
          dragOverTarget={dragOverTarget}
          onDragOverTarget={setDragOverTarget}
          onDropNoteOnFolder={handleDropNoteOnFolder}
          onDropNoteOnTrash={handleDropNoteOnTrash}
        />

        {screenView === "notes" ? (
          <NotesApp
            groupId={activeGroupId}
            groupName={activeGroup?.name ?? null}
            folders={noteFolders}
            notes={filteredNotes}
            events={events}
            eventTags={eventTags}
            tags={tags}
            searchQuery={notesSearchQuery}
            filter={notesFilter}
            selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId}
            onSearchChange={setNotesSearchQuery}
            onCreateNote={handleCreateNote}
            onNoteDraftChange={handleNoteDraftChange}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onRestoreNote={handleRestoreNote}
            onPermanentlyDeleteNote={handlePermanentlyDeleteNote}
            onEmptyTrash={handleEmptyTrash}
            draggingNoteIds={draggingNoteIds}
            onDraggingNoteIds={setDraggingNoteIds}
            onDragOverTarget={setDragOverTarget}
            onOpenWorkspaceModal={openWorkspaceOnboarding}
            places={places}
          />
        ) : screenView === "map" ? (
          <MapApp
            groupId={activeGroupId}
            places={places}
            events={filteredEvents}
            notes={filteredNotes}
            onCreatePlace={handleCreatePlace}
            onUpdatePlace={handleUpdatePlace}
            onDeletePlace={handleDeletePlace}
            onPlanEvent={(placeId) => openCreateModal(viewDate, placeId)}
            onOpenEvent={openEventDetails}
            onOpenNote={(noteId) => {
              setScreenView("notes");
              setSelectedNoteId(noteId);
            }}
            onCreateNote={async (placeId) => {
              const id = await handleCreateNote({ placeId, visibility: "shared" });
              if (id) {
                setScreenView("notes");
                setSelectedNoteId(id);
              }
            }}
            onOpenWorkspaceModal={openWorkspaceOnboarding}
          />
        ) : (
          <>
            <main data-snapshot-target className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
              {!activeGroupId && (
                <div
                  className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: "var(--accent-muted)",
                    color: "var(--accent-text)",
                    boxShadow: "inset 0 0 0 0.5px var(--hairline)",
                    letterSpacing: "-0.004em",
                  }}
                >
                  <span>
                    Create a shared workspace or join with an invite code to sync calendars between accounts.
                  </span>
                  <button
                    type="button"
                    onClick={openWorkspaceOnboarding}
                    className="pressable shrink-0 cursor-pointer px-3.5 py-1.5 text-xs font-semibold text-white"
                    style={{
                      borderRadius: "var(--radius-full)",
                      background: "var(--accent)",
                    }}
                  >
                    Create or join calendar
                  </button>

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
                weekStartsOnMonday={prefs.weekStartsOnMonday}
                todayJumpKey={todayJumpKey}
                onViewDateChange={setViewDate}
                onCalendarModeChange={setCalendarMode}
                onSelectEvent={openEventDetails}
                onDayDoubleClick={openCreateModal}
              />
            </main>

            {eventViewerOpen && (
              <PanelResizeHandle
                width={panelWidth}
                onResize={setPanelWidth}
                onDraggingChange={setPanelResizing}
              />
            )}

            <EventViewerPanel
              visible={eventViewerOpen}
              events={filteredEvents}
              tags={tags}
              eventTags={eventTags}
              searchQuery={searchQuery}
              weekStartsOnMonday={prefs.weekStartsOnMonday}
              todayJumpKey={todayJumpKey}
              onSelectEvent={openEventDetails}
              width={panelWidth}
              resizing={panelResizing}
            />

          </>
        )}
      </div>

      <CreateEventModal
        key="create-event-modal"
        open={modalOpen}
        defaultDate={modalDefaultDate}
        event={activeSelectedEvent}
        seriesEvents={seriesEvents}
        existingEvents={eventsWithRsvp}
        tags={tags}
        initialTagIds={selectedEventTagIds}
        places={places}
        initialPlaceId={activeSelectedEvent?.place_id ?? modalDefaultPlaceId}
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
        currentUserId={user?.id}
        eventRsvps={eventRsvps}
        groupProfilesById={groupProfilesById}
        onSetRsvp={handleSetEventRsvp}
        onNudgeUnanswered={handleNudgeUnanswered}
        confirmDeleteOthers={prefs.confirmDeleteOthers}
        weekStartsOnMonday={prefs.weekStartsOnMonday}
      />
    </div>
  );
}
