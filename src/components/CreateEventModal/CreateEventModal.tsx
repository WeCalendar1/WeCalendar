"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CalendarEvent } from "@/lib/events";
import { TagCreatorInline } from "@/components/TagCreatorInline";
import type { Tag } from "@/lib/tags";
import { getMonthGrid, addMonths, formatMonthYear } from "@/lib/calendar";
import { draftOverlapsExisting } from "@/lib/scheduling";
import { noteTitle, type Note } from "@/lib/notes";

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
};

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

// ─── Consecutive-group helper ────────────────────────────────────────────────

function groupConsecutiveDates(dates: Set<string>): string[][] {
  if (dates.size === 0) return [];
  const sorted = [...dates].sort();
  const groups: string[][] = [[sorted[0]!]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]! + "T00:00:00");
    const curr = new Date(sorted[i]! + "T00:00:00");
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (diffDays === 1) {
      groups[groups.length - 1]!.push(sorted[i]!);
    } else {
      groups.push([sorted[i]!]);
    }
  }

  return groups;
}

// ─── Day picker ──────────────────────────────────────────────────────────────

const PICKER_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type DayPickerProps = {
  selectedDates: Set<string>;
  onToggle: (dateStr: string) => void;
};

function DayPicker({ selectedDates, onToggle }: DayPickerProps) {
  const [pickerMonth, setPickerMonth] = useState<Date>(() => {
    const first = [...selectedDates].sort()[0];
    const base = first ? new Date(first + "T00:00:00") : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const days = getMonthGrid(pickerMonth);
  const today = toDateInput(new Date());
  const groups = groupConsecutiveDates(selectedDates);
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
        {PICKER_DAYS.map((d) => (
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

          const prevStr = toDateInput(new Date(day.date.getTime() - 86_400_000));
          const nextStr = toDateInput(new Date(day.date.getTime() + 86_400_000));
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

export function CreateEventModal({
  open,
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
}: CreateEventModalProps) {
  const isEditing = Boolean(event);

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => new Set([toDateInput(defaultDate)]));
  const [startTime, setStartTime] = useState(() => toTimeInput(defaultDate));
  const [endTime, setEndTime] = useState(() => toTimeInput(new Date(defaultDate.getTime() + 60 * 60 * 1000)));
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [repeats, setRepeats] = useState(false);
  const [repeatFreq, setRepeatFreq] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [repeatCount, setRepeatCount] = useState(4);

  // Sync state when opening or when active event / defaultDate changes
  useEffect(() => {
    if (!open) return;
    setTitle(event?.title ?? "");
    setDescription(event?.description ?? "");
    const start = event ? new Date(event.starts_at) : defaultDate;
    const end = event ? new Date(event.ends_at) : null;
    setStartTime(event ? toTimeInput(start) : toTimeInput(defaultDate));
    setEndTime(() => {
      if (end) return toTimeInput(end);
      return toTimeInput(new Date(defaultDate.getTime() + 60 * 60 * 1000));
    });
    setSelectedTagIds(initialTagIds);
    setConfirmDelete(false);
    setError(null);
    setRepeats(false);

    if (seriesEvents.length > 0) {
      const dates = new Set<string>();
      for (const e of seriesEvents) dates.add(toDateInput(new Date(e.starts_at)));
      setSelectedDates(dates);
    } else if (event) {
      setSelectedDates(new Set([toDateInput(new Date(event.starts_at))]));
    } else {
      setSelectedDates(new Set([toDateInput(defaultDate)]));
    }
  }, [open, event, defaultDate, initialTagIds, seriesEvents]);

  const softOverlap = useMemo(() => {
    const excludeIds = new Set(seriesEvents.map((e) => e.id));
    if (event) excludeIds.add(event.id);

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const titles = new Set<string>();

    for (const dateStr of selectedDates) {
      const [y, mo, d] = dateStr.split("-").map(Number);
      const startsAt = new Date(y!, mo! - 1, d!, sh!, sm!, 0);
      const endsAt = new Date(y!, mo! - 1, d!, eh!, em!, 0);
      if (endsAt <= startsAt) continue;
      const result = draftOverlapsExisting(startsAt, endsAt, existingEvents, excludeIds);
      for (const t of result.titles) titles.add(t);
    }

    return {
      overlaps: titles.size > 0,
      titles: [...titles],
    };
  }, [selectedDates, startTime, endTime, existingEvents, event, seriesEvents]);

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
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    const [sy, smo, sd] = startDateStr.split("-").map(Number);
    const startsAt = new Date(sy!, smo! - 1, sd!, sh!, sm!, 0);

    const [ey, emo, ed] = endDateStr.split("-").map(Number);
    const endsAt = new Date(ey!, emo! - 1, ed!, eh!, em!, 0);

    if (offsetMonths !== 0) {
      startsAt.setMonth(startsAt.getMonth() + offsetMonths);
      endsAt.setMonth(endsAt.getMonth() + offsetMonths);
    }
    if (offsetDays !== 0) {
      startsAt.setDate(startsAt.getDate() + offsetDays);
      endsAt.setDate(endsAt.getDate() + offsetDays);
    }

    if (endsAt <= startsAt) return null;

    return {
      title: title.trim(),
      description: description.trim(),
      startsAt,
      endsAt,
      tagIds: selectedTagIds,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (eh! < sh! || (eh === sh && em! <= sm!)) {
      setError("End time must be after start time.");
      return;
    }

    const groups = groupConsecutiveDates(selectedDates);
    if (groups.length === 0) {
      setError("Please select at least one date.");
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

  async function handleDelete() {
    if (!event || !onDelete) return;
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
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSeriesAction() {
    if (!event || !event.recurrence_group_id || !onDeleteSeries) return;
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
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
                            setSelectedDates(new Set([toDateInput(new Date(event.starts_at))]));
                          }
                        }}
                        className="pressable text-[10px] font-semibold"
                        style={{ color: "var(--color-danger)" }}
                      >
                        Remove repeating
                      </button>
                    )}
                  </div>

                  <DayPicker selectedDates={selectedDates} onToggle={toggleDay} />
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
                          background: confirmDelete ? "var(--color-danger)" : "rgba(255, 59, 48, 0.08)",
                          color: confirmDelete ? "#fff" : "var(--color-danger)",
                        }}
                      >
                        {confirmDelete ? "Confirm delete" : "Delete"}
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
                            background: confirmDelete ? "var(--color-danger)" : "rgba(255, 59, 48, 0.08)",
                            color: confirmDelete ? "#fff" : "var(--color-danger)",
                          }}
                        >
                          {confirmDelete ? "Confirm series" : "Delete series"}
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
                              const baseCount = selectedDates.size;
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
      )}
    </AnimatePresence>
  );
}
