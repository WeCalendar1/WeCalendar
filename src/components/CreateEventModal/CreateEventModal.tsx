"use client";

import { type FormEvent, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  buildDraftInterval,
  expandEventDateKeys,
  groupConsecutiveDateKeys,
  validateDraftDateGroups,
  type CalendarEvent,
} from "@/lib/events";
import { TagCreatorInline } from "@/components/TagCreatorInline";
import type { Tag } from "@/lib/tags";
import { addDays, addMonths, formatMonthYear, getMonthGrid, getWeekdayLabels } from "@/lib/calendar";
import { draftOverlapsExisting } from "@/lib/scheduling";
import { noteTitle, type Note } from "@/lib/notes";
import { unansweredMemberIdsForEvent } from "@/lib/notifications";
import {
  summarizeEventRsvps,
  type EventRsvp,
  type RsvpStatus,
} from "@/lib/rsvps";

export type EventDraft = {
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  tagIds: string[];
};

type CreateEventModalProps = {
  open: boolean;
  defaultDate: Date;
  event?: CalendarEvent | null;
  seriesEvents?: CalendarEvent[];
  /** Other workspace events - used for soft overlap warnings */
  existingEvents?: CalendarEvent[];
  /** All tags available for this group */
  tags: Tag[];
  /** Tag IDs already assigned to this event (when editing) */
  initialTagIds?: string[];
  onClose: () => void;
  onCreate: (input: EventDraft) => Promise<void>;
  onCreateMultiple?: (drafts: EventDraft[]) => Promise<void>;
  onUpdate?: (eventId: string, input: EventDraft) => Promise<void>;
  onUpdateSeries?: (recurrenceGroupId: string, drafts: EventDraft[]) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  onDeleteSeries?: (recurrenceGroupId: string) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<void>;
  /** Notes linked to this event (when editing) */
  linkedNotes?: Note[];
  onOpenNote?: (noteId: string) => void;
  onCreateNoteForEvent?: (eventId: string) => Promise<void>;
  /** ID of the currently logged-in user (for ownership checks) */
  currentUserId?: string | null;
  /** Group RSVP rows for events in the active workspace */
  eventRsvps?: readonly EventRsvp[];
  /** Group member profile map for rendering RSVP respondent names */
  groupProfilesById?: ReadonlyMap<string, { display_name: string | null; avatar_url?: string | null }>;
  /** Immediate RSVP handler (pass null status to clear response) */
  onSetRsvp?: (eventIds: string[], status: RsvpStatus | null) => Promise<void>;
  /** Sends an availability nudge to unanswered workspace members for this event */
  onNudgeUnanswered?: (eventId: string) => Promise<number>;
  /** When true, deleting another user's event requires an extra confirmation */
  confirmDeleteOthers?: boolean;
  /** When true, DayPicker columns start on Monday instead of Sunday */
  weekStartsOnMonday?: boolean;
};

const RSVP_OPTIONS: readonly { id: RsvpStatus; label: string; color: string }[] = [
  { id: "going", label: "Going", color: "#10b981" },
  { id: "maybe", label: "Maybe", color: "#f59e0b" },
  { id: "declined", label: "Declined", color: "#ef4444" },
];

function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toTimeInput(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// ─── Day picker ──────────────────────────────────────────────────────────────

type DayPickerProps = {
  selectedDates: Set<string>;
  onToggle: (dateStr: string) => void;
  weekStartsOnMonday?: boolean;
};

function DayPicker({ selectedDates, onToggle, weekStartsOnMonday = false }: DayPickerProps) {
  const [pickerMonth, setPickerMonth] = useState<Date>(() => {
    const first = [...selectedDates].sort()[0];
    const base = first ? new Date(first + "T00:00:00") : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const days = getMonthGrid(pickerMonth, new Date(), weekStartsOnMonday);
  const pickerDays = getWeekdayLabels(weekStartsOnMonday, "two");
  const today = toDateInput(new Date());
  const groups = groupConsecutiveDateKeys(selectedDates);
  const eventCount = groups.length;

  function buildHint(): string {
    if (selectedDates.size === 0) return "Click days to select";
    if (selectedDates.size === 1) return "1 day · click more to add";
    const parts = groups.map((g) => (g.length === 1 ? "1 day" : `${g.length} days`));
    return `${eventCount} event${eventCount !== 1 ? "s" : ""} · ${parts.join(" + ")}`;
  }

  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        overflow: "hidden",
        background: "var(--surface)",
      }}
    >
      {/* Month navigation */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        <button
          type="button"
          onClick={() => setPickerMonth((m) => addMonths(m, -1))}
          className="pressable flex h-6 w-6 items-center justify-center rounded-full text-xs"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Previous month"
        >
          ‹
        </button>

        <span className="text-xs font-semibold" style={{ color: "var(--foreground)", letterSpacing: "-0.006em" }}>
          {formatMonthYear(pickerMonth)}
        </span>

        <button
          type="button"
          onClick={() => setPickerMonth((m) => addMonths(m, 1))}
          className="pressable flex h-6 w-6 items-center justify-center rounded-full text-xs"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-1 pt-1">
        {pickerDays.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-semibold uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 px-1 pb-1">
        {days.map((day) => {
          const dateStr = toDateInput(day.date);
          const selected = selectedDates.has(dateStr);
          const isToday = dateStr === today;

          const prevStr = toDateInput(addDays(day.date, -1));
          const nextStr = toDateInput(addDays(day.date, 1));
          const prevSel = selectedDates.has(prevStr);
          const nextSel = selectedDates.has(nextStr);

          const isSolo = selected && !prevSel && !nextSel;
          const isStart = selected && !prevSel && nextSel;
          const isEnd = selected && prevSel && !nextSel;
          const isMid = selected && prevSel && nextSel;
          const hasLeft = isEnd || isMid;
          const hasRight = isStart || isMid;

          return (
            <div key={dateStr} className="relative flex items-center justify-center py-0.5">
              {selected && !isSolo && (
                <div
                  className="absolute inset-y-0.5"
                  style={{
                    background: "var(--accent-muted)",
                    left: hasLeft ? "0" : "50%",
                    right: hasRight ? "0" : "50%",
                    zIndex: 0,
                  }}
                />
              )}

              <button
                type="button"
                onClick={() => onToggle(dateStr)}
                className="pressable relative z-10 flex h-7 w-7 items-center justify-center text-[11px] font-semibold"
                style={{
                  borderRadius: "var(--radius-full)",
                  background: selected ? "var(--accent)" : "transparent",
                  color: selected
                    ? "#fff"
                    : isToday
                      ? "var(--accent)"
                      : day.inCurrentMonth
                        ? "var(--foreground)"
                        : "var(--text-muted)",
                  opacity: !day.inCurrentMonth && !selected ? 0.45 : 1,
                  outline: isToday && !selected ? "1.5px solid var(--accent)" : "none",
                  outlineOffset: "-1px",
                  fontWeight: isToday ? 700 : 600,
                  boxShadow: selected ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
                }}
              >
                {day.date.getDate()}
              </button>
            </div>
          );
        })}
      </div>

      {/* Hint */}
      <div
        className="px-3 py-1.5 text-center text-[10px]"
        style={{
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border)",
          background: "var(--surface-2)",
        }}
      >
        {buildHint()}
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function CreateEventModal(props: CreateEventModalProps) {
  const formKey = props.event?.id ?? `new-${toDateInput(props.defaultDate)}`;
  return (
    <AnimatePresence>
      {props.open ? <CreateEventModalContent key={formKey} {...props} /> : null}
    </AnimatePresence>
  );
}

function CreateEventModalContent({
  defaultDate,
  event = null,
  seriesEvents = [],
  existingEvents = [],
  tags,
  initialTagIds = [],
  onClose,
  onCreate,
  onCreateMultiple,
  onUpdate,
  onUpdateSeries,
  onDelete,
  onDeleteSeries,
  onCreateTag,
  linkedNotes = [],
  onOpenNote,
  onCreateNoteForEvent,
  currentUserId,
  eventRsvps = [],
  groupProfilesById,
  onSetRsvp,
  onNudgeUnanswered,
  confirmDeleteOthers = true,
  weekStartsOnMonday = false,
}: CreateEventModalProps) {
  const isEditing = Boolean(event);

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => {
    if (seriesEvents.length > 0) {
      const dates = new Set<string>();
      for (const e of seriesEvents) {
        for (const k of expandEventDateKeys(e.starts_at, e.ends_at)) dates.add(k);
      }
      return dates;
    }
    if (event) return new Set(expandEventDateKeys(event.starts_at, event.ends_at));
    return new Set([toDateInput(defaultDate)]);
  });
  const [startTime, setStartTime] = useState(() =>
    event ? toTimeInput(new Date(event.starts_at)) : toTimeInput(defaultDate),
  );
  const [endTime, setEndTime] = useState(() => {
    if (event) return toTimeInput(new Date(event.ends_at));
    return toTimeInput(new Date(defaultDate.getTime() + 60 * 60 * 1000));
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Extra owner-confirmation step: fires when deleting another user's event
  const [confirmOwner, setConfirmOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [repeats, setRepeats] = useState(false);
  const [repeatFreq, setRepeatFreq] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [repeatCount, setRepeatCount] = useState(4);
  const [applyRsvpToSeries, setApplyRsvpToSeries] = useState(false);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [nudgeBusy, setNudgeBusy] = useState(false);
  const [nudgeStatus, setNudgeStatus] = useState<string | null>(null);

  const emptyProfiles = useMemo(
    () => new Map<string, { display_name: string | null; avatar_url?: string | null }>(),
    [],
  );
  const rsvpSummary = useMemo(
    () =>
      event
        ? summarizeEventRsvps(
            event.id,
            eventRsvps,
            groupProfilesById ?? emptyProfiles,
            currentUserId,
          )
        : null,
    [event, eventRsvps, groupProfilesById, emptyProfiles, currentUserId],
  );

  const unansweredCount = useMemo(() => {
    if (!event || !groupProfilesById) return 0;
    return unansweredMemberIdsForEvent(
      event.id,
      [...groupProfilesById.keys()],
      eventRsvps,
      currentUserId,
    ).length;
  }, [event, groupProfilesById, eventRsvps, currentUserId]);

  async function handleNudgeClick() {
    if (!event || !onNudgeUnanswered) return;
    setNudgeBusy(true);
    setNudgeStatus(null);
    setError(null);
    try {
      const sent = await onNudgeUnanswered(event.id);
      setNudgeStatus(
        sent > 0
          ? `Nudged ${sent} member${sent === 1 ? "" : "s"}`
          : "Already nudged recently (or notifications off)",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send nudge.");
    } finally {
      setNudgeBusy(false);
    }
  }

  async function handleRsvpSelect(option: RsvpStatus) {
    if (!event || !onSetRsvp) return;
    const nextStatus = rsvpSummary?.myStatus === option ? null : option;
    const targetIds =
      applyRsvpToSeries && seriesEvents.length > 1
        ? seriesEvents.map((e) => e.id)
        : [event.id];
    setRsvpBusy(true);
    setError(null);
    try {
      await onSetRsvp(targetIds, nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update RSVP.");
    } finally {
      setRsvpBusy(false);
    }
  }

  const softOverlap = useMemo(() => {
    if (
      isEditing &&
      event &&
      (rsvpSummary?.myStatus === "declined" || event.myRsvp === "declined")
    ) {
      return { overlaps: false, titles: [] };
    }

    const excludeIds = new Set(seriesEvents.map((e) => e.id));
    if (event) excludeIds.add(event.id);
    const activeExisting = existingEvents.filter((e) => e.myRsvp !== "declined");

    const titles = new Set<string>();

    for (const grp of groupConsecutiveDateKeys(selectedDates)) {
      const interval = buildDraftInterval(grp[0]!, grp[grp.length - 1]!, startTime, endTime);
      if (!interval) continue;
      const result = draftOverlapsExisting(
        interval.startsAt,
        interval.endsAt,
        activeExisting,
        excludeIds,
      );
      for (const t of result.titles) titles.add(t);
    }

    return {
      overlaps: titles.size > 0,
      titles: [...titles],
    };
  }, [
    isEditing,
    rsvpSummary,
    selectedDates,
    startTime,
    endTime,
    existingEvents,
    event,
    seriesEvents,
  ]);

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  function toggleDay(dateStr: string) {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }

  function buildDraft(
    startDateStr: string,
    endDateStr: string = startDateStr,
    offsetDays = 0,
    offsetMonths = 0,
  ): EventDraft | null {
    const interval = buildDraftInterval(
      startDateStr,
      endDateStr,
      startTime,
      endTime,
      offsetDays,
      offsetMonths,
    );
    if (!interval) return null;

    return {
      title: title.trim(),
      description: description.trim(),
      startsAt: interval.startsAt,
      endsAt: interval.endsAt,
      tagIds: selectedTagIds,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const groups = groupConsecutiveDateKeys(selectedDates);
    const isSeriesEdit = Boolean(
      isEditing && event && seriesEvents.length > 1 && onUpdateSeries && event.recurrence_group_id,
    );
    const validationError = validateDraftDateGroups(groups, startTime, endTime, {
      isSingleEventEdit: Boolean(isEditing && event && !isSeriesEdit),
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (isEditing && event) {
        if (seriesEvents.length > 1 && onUpdateSeries && event.recurrence_group_id) {
          const drafts: EventDraft[] = [];
          for (const grp of groups) {
            const d = buildDraft(grp[0]!, grp[grp.length - 1]!);
            if (d) drafts.push(d);
          }
          if (drafts.length === 0) {
            setError("End time must be after start time.");
            return;
          }
          await onUpdateSeries(event.recurrence_group_id, drafts);
        } else if (onUpdate) {
          const firstGroup = groups[0]!;
          const d = buildDraft(firstGroup[0]!, firstGroup[firstGroup.length - 1]!);
          if (!d) {
            setError("End time must be after start time.");
            return;
          }
          await onUpdate(event.id, d);
        }
      } else {
        const baseDrafts: { startStr: string; endStr: string }[] = groups.map((grp) => ({
          startStr: grp[0]!,
          endStr: grp[grp.length - 1]!,
        }));

        const allDrafts: EventDraft[] = [];
        const iterations = repeats ? repeatCount : 1;

        for (let i = 0; i < iterations; i++) {
          let offsetDays = 0;
          let offsetMonths = 0;
          if (repeats && i > 0) {
            if (repeatFreq === "daily") offsetDays = i;
            else if (repeatFreq === "weekly") offsetDays = i * 7;
            else if (repeatFreq === "monthly") offsetMonths = i;
          }

          for (const base of baseDrafts) {
            const d = buildDraft(base.startStr, base.endStr, offsetDays, offsetMonths);
            if (d) allDrafts.push(d);
          }
        }

        if (allDrafts.length === 0) {
          setError("End time must be after start time.");
          return;
        }

        if (allDrafts.length === 1) {
          await onCreate(allDrafts[0]!);
        } else if (onCreateMultiple) {
          await onCreateMultiple(allDrafts);
        } else {
          for (const d of allDrafts) await onCreate(d);
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save event.");
    } finally {
      setBusy(false);
    }
  }

  // True when the event was created by someone other than the current user
  const isOthersEvent =
    Boolean(event?.created_by) &&
    Boolean(currentUserId) &&
    event?.created_by !== currentUserId;

  async function handleDelete() {
    if (!event || !onDelete) return;

    // Step 1: if the event belongs to another user and the pref is on,
    // gate behind an owner-specific confirmation before the normal one.
    if (isOthersEvent && confirmDeleteOthers && !confirmOwner) {
      setConfirmOwner(true);
      return;
    }

    // Step 2: normal delete confirmation
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onDelete(event.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete event.");
      setConfirmDelete(false);
      setConfirmOwner(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSeriesAction() {
    if (!event || !event.recurrence_group_id || !onDeleteSeries) return;

    if (isOthersEvent && confirmDeleteOthers && !confirmOwner) {
      setConfirmOwner(true);
      return;
    }

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onDeleteSeries(event.recurrence_group_id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete series.");
      setConfirmDelete(false);
      setConfirmOwner(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Translucent dimming scrim */}
          <motion.div
            className="fixed inset-0"
            style={{
              background: "var(--scrim)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
          />

          {/* Dialog surface */}
          <motion.div
            className="relative z-10 flex w-full max-w-md flex-col overflow-hidden"
            style={{
              borderRadius: "var(--radius-xl)",
              background: "var(--glass-bg-heavy)",
              backdropFilter: "var(--glass-blur-heavy)",
              WebkitBackdropFilter: "var(--glass-blur-heavy)",
              boxShadow: "var(--shadow-lg)",
              maxHeight: "90vh",
            }}
            initial={{ opacity: 0, scale: 0.96, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, y: 14, filter: "blur(4px)" }}
            transition={{ type: "spring", bounce: 0, duration: 0.34 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Apple-style close circle */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ boxShadow: "inset 0 -0.5px 0 var(--separator)" }}
            >
              <div>
                <h2
                  className="text-base font-semibold tracking-tight"
                  style={{ color: "var(--foreground)", letterSpacing: "-0.015em" }}
                >
                  {isEditing ? "Event details" : "Create shared event"}
                </h2>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {isEditing
                    ? "Changes sync to everyone in the workspace."
                    : "This event syncs to everyone in the workspace."}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="pressable flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-secondary)",
                }}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event title"
                  className="w-full px-3.5 py-2.5 text-sm outline-none transition-all"
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--foreground)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-sm outline-none transition-all"
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--foreground)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />

                {/* Date selection */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      {isEditing ? "Date" : "Day(s)"}
                    </p>
                    {isEditing && seriesEvents.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (event) {
                            setSelectedDates(new Set(expandEventDateKeys(event.starts_at, event.ends_at)));
                          }
                        }}
                        className="pressable text-[10px] font-semibold"
                        style={{ color: "var(--color-danger)" }}
                      >
                        Remove repeating
                      </button>
                    )}
                  </div>

                  <DayPicker
                    selectedDates={selectedDates}
                    onToggle={toggleDay}
                    weekStartsOnMonday={weekStartsOnMonday}
                  />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    Start
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm outline-none transition-all"
                      style={{
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                        color: "var(--foreground)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </label>
                  <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    End
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm outline-none transition-all"
                      style={{
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                        color: "var(--foreground)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </label>
                </div>

                {/* Repeating */}
                {(!isEditing || seriesEvents.length <= 1) && (
                  <div className="flex flex-col gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      <input
                        type="checkbox"
                        checked={repeats}
                        onChange={(e) => setRepeats(e.target.checked)}
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      Repeat this event
                    </label>

                    {repeats && (
                      <div className="flex items-center gap-2.5 pl-6">
                        <select
                          value={repeatFreq}
                          onChange={(e) => setRepeatFreq(e.target.value as "daily" | "weekly" | "monthly")}
                          className="px-2.5 py-1.5 text-xs font-medium outline-none"
                          style={{
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border)",
                            background: "var(--surface-2)",
                            color: "var(--foreground)",
                          }}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                          for
                        </span>
                        <input
                          type="number"
                          min="2"
                          max="52"
                          value={repeatCount}
                          onChange={(e) => setRepeatCount(parseInt(e.target.value) || 2)}
                          className="w-16 px-2.5 py-1.5 text-xs font-medium outline-none"
                          style={{
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border)",
                            background: "var(--surface-2)",
                            color: "var(--foreground)",
                          }}
                        />
                        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                          {repeatFreq === "daily" ? "days" : repeatFreq === "weekly" ? "weeks" : "months"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Attendance (RSVP) */}
                {isEditing && event && onSetRsvp && rsvpSummary && (
                  <div
                    className="flex flex-col gap-2 rounded-xl p-3"
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                        Attendance
                      </p>
                      <div className="flex items-center gap-1.5" role="group" aria-label="Your RSVP">
                        {RSVP_OPTIONS.map((opt) => {
                          const active = rsvpSummary.myStatus === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={rsvpBusy || busy}
                              aria-pressed={active}
                              onClick={() => void handleRsvpSelect(opt.id)}
                              className="pressable flex cursor-pointer items-center gap-1.5 px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                              style={{
                                borderRadius: "var(--radius-full)",
                                border: `1.5px solid ${active ? opt.color : "var(--border)"}`,
                                background: active
                                  ? `color-mix(in srgb, ${opt.color} 16%, var(--surface))`
                                  : "var(--surface)",
                                color: active ? opt.color : "var(--text-secondary)",
                              }}
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ background: opt.color }}
                              />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {seriesEvents.length > 1 && (
                      <label
                        className="flex cursor-pointer items-center gap-2 text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <input
                          type="checkbox"
                          checked={applyRsvpToSeries}
                          onChange={(e) => setApplyRsvpToSeries(e.target.checked)}
                          className="h-3.5 w-3.5 rounded accent-[var(--accent)]"
                        />
                        Apply RSVP to all {seriesEvents.length} events in series
                      </label>
                    )}

                    <div
                      className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Going · {rsvpSummary.counts.going}</span>
                        <span>Maybe · {rsvpSummary.counts.maybe}</span>
                        <span>Declined · {rsvpSummary.counts.declined}</span>
                      </div>
                      {onNudgeUnanswered && unansweredCount > 0 && (
                        <button
                          type="button"
                          disabled={nudgeBusy || busy}
                          onClick={() => void handleNudgeClick()}
                          className="pressable cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                          style={{
                            background: "var(--accent-muted)",
                            color: "var(--accent)",
                          }}
                        >
                          {nudgeBusy ? "Sending…" : `Nudge unanswered (${unansweredCount})`}
                        </button>
                      )}
                    </div>
                    {nudgeStatus && (
                      <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
                        {nudgeStatus}
                      </p>
                    )}

                    {rsvpSummary.respondents.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {rsvpSummary.respondents.map((resp) => {
                          const dotColor =
                            resp.status === "going"
                              ? "#10b981"
                              : resp.status === "maybe"
                                ? "#f59e0b"
                                : "#ef4444";
                          return (
                            <span
                              key={resp.userId}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium"
                              style={{
                                borderRadius: "var(--radius-full)",
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--foreground)",
                              }}
                            >
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ background: dotColor }}
                              />
                              <span>{resp.displayName}</span>
                              <span style={{ color: "var(--text-muted)" }}>
                                ({resp.status})
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Linked notes */}
                {isEditing && event && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      Notes
                    </p>
                    {linkedNotes.length > 0 ? (
                      <ul className="space-y-1">
                        {linkedNotes.map((note) => (
                          <li key={note.id}>
                            <button
                              type="button"
                              onClick={() => onOpenNote?.(note.id)}
                              className="pressable w-full rounded-lg px-3 py-2 text-left text-xs font-medium"
                              style={{
                                border: "1px solid var(--border)",
                                background: "var(--surface-2)",
                                color: "var(--foreground)",
                              }}
                            >
                              {noteTitle(note)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        No notes linked to this event yet.
                      </p>
                    )}
                    {onCreateNoteForEvent && (
                      <button
                        type="button"
                        onClick={() => void onCreateNoteForEvent(event.id)}
                        className="pressable self-start text-xs font-semibold"
                        style={{ color: "var(--accent)" }}
                      >
                        + Add note for this event
                      </button>
                    )}
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                    Tags
                  </p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => {
                        const active = selectedTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className="pressable flex items-center gap-1 px-2.5 py-1 text-xs font-medium"
                            style={{
                              borderRadius: "var(--radius-full)",
                              border: `1.5px solid ${tag.color}`,
                              background: active ? tag.color : "transparent",
                              color: active ? "#fff" : tag.color,
                            }}
                          >
                            {active && (
                              <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 6l3 3 5-5" />
                              </svg>
                            )}
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <TagCreatorInline onAdd={onCreateTag} />
                </div>

                {softOverlap.overlaps && (
                  <div
                    className="rounded-lg px-3 py-2 text-xs"
                    style={{
                      background: "rgba(255, 59, 48, 0.1)",
                      border: "1px solid rgba(255, 59, 48, 0.25)",
                      color: "var(--color-danger)",
                    }}
                  >
                    Overlaps with {softOverlap.titles.slice(0, 2).join(", ")}
                    {softOverlap.titles.length > 2 ? ` +${softOverlap.titles.length - 2} more` : ""}.
                    Conflicting events will be highlighted.
                  </div>
                )}

                {/* Owner-confirmation warning banner */}
                {confirmOwner && !confirmDelete && isOthersEvent && (
                  <div
                    className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
                    style={{
                      background: "rgba(255, 149, 0, 0.08)",
                      border: "1px solid rgba(255, 149, 0, 0.3)",
                      color: "var(--foreground)",
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#f97316" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span style={{ color: "var(--text-secondary)" }}>
                      This event was created by{" "}
                      <strong style={{ color: "var(--foreground)" }}>
                        {event?.creator?.display_name ?? "another user"}
                      </strong>
                      . Are you sure you want to delete it?
                    </span>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <p className="text-xs font-medium" style={{ color: "var(--color-danger)" }}>
                    {error}
                  </p>
                )}

                {/* Actions bar */}
                <div
                  className="flex items-center justify-between gap-2 border-t pt-3"
                  style={{ borderColor: "var(--separator)" }}
                >
                  {isEditing && onDelete ? (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleDelete()}
                        className="pressable px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                        style={{
                          borderRadius: "var(--radius-md)",
                          border: "1px solid rgba(255, 59, 48, 0.3)",
                          background: confirmDelete ? "var(--color-danger)" : confirmOwner ? "rgba(255, 149, 0, 0.12)" : "rgba(255, 59, 48, 0.08)",
                          color: confirmDelete ? "#fff" : confirmOwner ? "#ea580c" : "var(--color-danger)",
                        }}
                      >
                        {confirmDelete ? "Confirm delete" : confirmOwner ? "Yes, delete it" : "Delete"}
                      </button>
                      {event?.recurrence_group_id && onDeleteSeries && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDeleteSeriesAction()}
                          className="pressable px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                          style={{
                            borderRadius: "var(--radius-md)",
                            border: "1px solid rgba(255, 59, 48, 0.3)",
                            background: confirmDelete ? "var(--color-danger)" : confirmOwner ? "rgba(255, 149, 0, 0.12)" : "rgba(255, 59, 48, 0.08)",
                            color: confirmDelete ? "#fff" : confirmOwner ? "#ea580c" : "var(--color-danger)",
                          }}
                        >
                          {confirmDelete ? "Confirm series" : confirmOwner ? "Yes, delete series" : "Delete series"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <span />
                  )}


                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="pressable px-3.5 py-1.5 text-xs font-medium"
                      style={{
                        borderRadius: "var(--radius-full)",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--foreground)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busy || (!isEditing && selectedDates.size === 0)}
                      className="pressable px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      style={{
                        borderRadius: "var(--radius-full)",
                        background: "var(--accent)",
                      }}
                    >
                      {busy
                        ? "Saving…"
                        : isEditing
                          ? "Save changes"
                          : (() => {
                              const baseCount = groupConsecutiveDateKeys(selectedDates).length;
                              const totalCount = repeats ? baseCount * repeatCount : baseCount;
                              return totalCount > 1 ? `Save ${totalCount} events` : "Save event";
                            })()}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
    </div>
  );
}
