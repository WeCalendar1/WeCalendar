"use client";

import { type FormEvent, useMemo, useState } from "react";
import type { CalendarEvent } from "@/lib/events";
import { TagCreatorInline } from "@/components/TagCreatorInline";
import type { Tag } from "@/lib/tags";
import { getMonthGrid, addMonths, formatMonthYear } from "@/lib/calendar";
import { draftOverlapsExisting } from "@/lib/scheduling";

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

/**
 * Given a set of yyyy-mm-dd date strings, returns groups of consecutive dates.
 * e.g. {"Mon", "Tue", "Thu", "Fri"} → [["Mon","Tue"], ["Thu","Fri"]]
 * Each group will produce one event (spanning all days in that group).
 */
function groupConsecutiveDates(dates: Set<string>): string[][] {
  if (dates.size === 0) return [];
  const sorted = [...dates].sort(); // lexicographic = chronological for yyyy-mm-dd
  const groups: string[][] = [[sorted[0]!]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]! + "T00:00:00");
    const curr = new Date(sorted[i]!  + "T00:00:00");
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (diffDays === 1) {
      groups[groups.length - 1]!.push(sorted[i]!);
    } else {
      groups.push([sorted[i]!]);
    }
  }

  return groups;
}

// ─── Day picker (toggle individual days; consecutive = one event) ─────────────

const PICKER_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type DayPickerProps = {
  /** Selected dates as yyyy-mm-dd strings */
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

  // Build hint line describing how many events will be created
  function buildHint(): string {
    if (selectedDates.size === 0) return "Click days to select";
    if (selectedDates.size === 1) return "1 day - click more to add";
    const parts = groups.map((g) =>
      g.length === 1 ? "1 day" : `${g.length} days`
    );
    return `${eventCount} event${eventCount !== 1 ? "s" : ""} - ${parts.join(" + ")}`;
  }

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1.5px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* Month navigation */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        <button
          type="button"
          onClick={() => setPickerMonth((m) => addMonths(m, -1))}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Previous month"
        >
          ‹
        </button>

        <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
          {formatMonthYear(pickerMonth)}
        </span>

        <button
          type="button"
          onClick={() => setPickerMonth((m) => addMonths(m, 1))}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-sm transition-opacity hover:opacity-70"
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
          const dateStr  = toDateInput(day.date);
          const selected = selectedDates.has(dateStr);
          const isToday  = dateStr === today;

          // Determine adjacency to show connecting range band
          const prevStr = toDateInput(new Date(day.date.getTime() - 86_400_000));
          const nextStr = toDateInput(new Date(day.date.getTime() + 86_400_000));
          const prevSel = selectedDates.has(prevStr);
          const nextSel = selectedDates.has(nextStr);

          const isSolo  = selected && !prevSel && !nextSel;
          const isStart = selected && !prevSel && nextSel;
          const isEnd   = selected && prevSel && !nextSel;
          const isMid   = selected && prevSel && nextSel;
          const hasLeft  = isEnd || isMid;
          const hasRight = isStart || isMid;

          return (
            <div key={dateStr} className="relative flex items-center justify-center py-0.5">
              {/* Connecting band for consecutive groups */}
              {selected && !isSolo && (
                <div
                  className="absolute inset-y-0.5"
                  style={{
                    background: "var(--accent-muted)",
                    left:  hasLeft  ? "0"   : "50%",
                    right: hasRight ? "0"   : "50%",
                    zIndex: 0,
                  }}
                />
              )}

              {/* Day circle */}
              <button
                type="button"
                onClick={() => onToggle(dateStr)}
                className="relative z-10 flex h-7 w-7 cursor-pointer items-center justify-center text-[11px] font-semibold transition-all"
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
                  boxShadow: selected ? "0 1px 4px rgb(99 102 241 / 0.35)" : "none",
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
}: CreateEventModalProps) {
  const isEditing = Boolean(event);
  const start = event ? new Date(event.starts_at) : defaultDate;
  const end   = event ? new Date(event.ends_at)   : null;

  const [title, setTitle]             = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");

  // Single set of individually-toggled dates for both create and edit modes
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => {
    if (seriesEvents.length > 0) {
      const dates = new Set<string>();
      for (const e of seriesEvents) {
        dates.add(toDateInput(new Date(e.starts_at)));
      }
      return dates;
    }
    if (event) {
      return new Set([toDateInput(new Date(event.starts_at))]);
    }
    return new Set([toDateInput(defaultDate)]);
  });

  const [startTime, setStartTime]     = useState(event ? toTimeInput(start) : toTimeInput(defaultDate));
  const [endTime, setEndTime]         = useState(() => {
    if (end) return toTimeInput(end);
    const defaultEnd = new Date(defaultDate.getTime() + 60 * 60 * 1000);
    return toTimeInput(defaultEnd);
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
  const [busy, setBusy]               = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Repeating events state (Create mode only)
  const [repeats, setRepeats] = useState(false);
  const [repeatFreq, setRepeatFreq] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [repeatCount, setRepeatCount] = useState(4);

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
      for (const title of result.titles) titles.add(title);
    }

    return {
      overlaps: titles.size > 0,
      titles: [...titles],
    };
  }, [selectedDates, startTime, endTime, existingEvents, event, seriesEvents]);

  if (!open) return null;

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  function toggleDay(dateStr: string) {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  }

  function buildDraft(startDateStr: string, endDateStr: string = startDateStr, offsetDays = 0, offsetMonths = 0): EventDraft | null {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    
    const [sy, smo, sd] = startDateStr.split("-").map(Number);
    let startsAt = new Date(sy!, smo! - 1, sd!, sh!, sm!, 0);
    
    const [ey, emo, ed] = endDateStr.split("-").map(Number);
    let endsAt   = new Date(ey!, emo! - 1, ed!, eh!, em!, 0);

    if (offsetDays !== 0) {
      startsAt = new Date(startsAt.getTime() + offsetDays * 86_400_000);
      endsAt   = new Date(endsAt.getTime() + offsetDays * 86_400_000);
    }
    if (offsetMonths !== 0) {
      startsAt = addMonths(startsAt, offsetMonths);
      endsAt   = addMonths(endsAt, offsetMonths);
    }

    if (startDateStr === endDateStr && endsAt <= startsAt) {
      setError("End time must be after start time.");
      return null;
    }

    return { title: title.trim(), description: description.trim(), startsAt, endsAt, tagIds: selectedTagIds };
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setBusy(true);
    setError(null);
    setConfirmDelete(false);

    if (selectedDates.size === 0) {
      setError("Select at least one day.");
      setBusy(false);
      return;
    }

    try {
      const drafts: EventDraft[] = [];
      const occurrences = ((!isEditing || seriesEvents.length <= 1) && repeats) ? repeatCount : 1;

      for (const dateStr of selectedDates) {
        for (let i = 0; i < occurrences; i++) {
          let offsetDays = 0;
          let offsetMonths = 0;
          if ((!isEditing || seriesEvents.length <= 1) && repeats) {
            if (repeatFreq === "daily") offsetDays = i;
            else if (repeatFreq === "weekly") offsetDays = i * 7;
            else if (repeatFreq === "monthly") offsetMonths = i;
          }

          const draft = buildDraft(dateStr, dateStr, offsetDays, offsetMonths);
          if (!draft) return; // buildDraft already set error
          drafts.push(draft);
        }
      }

      if (isEditing && event) {
        if (event.recurrence_group_id && onUpdateSeries) {
          await onUpdateSeries(event.recurrence_group_id, drafts);
        } else if (onUpdate) {
          if (drafts.length > 1 && onCreateMultiple) {
            // Upgrading a single event to a series!
            if (onDelete) await onDelete(event.id);
            await onCreateMultiple(drafts);
          } else {
            // Just updating a single event
            await onUpdate(event.id, drafts[0]!);
          }
        }
      } else {
        // Create mode
        if (onCreateMultiple) {
          await onCreateMultiple(drafts);
        } else {
          await Promise.all(drafts.map((d) => onCreate(d)));
        }
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditing ? "Could not update event." : "Could not create event.",
      );
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgb(15 23 42 / 0.35)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-5"
        style={{
          borderRadius: "var(--radius-xl)",
          background:   "var(--surface)",
          boxShadow:    "var(--shadow-lg)",
          border:       "1.5px solid var(--border)",
          maxHeight:    "90vh",
          overflowY:    "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)" }}
        >
          {isEditing ? "Event details" : "Create shared event"}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {isEditing
            ? "Changes sync to everyone in the workspace."
            : "This event syncs to everyone in the workspace."}
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={{ borderRadius: "var(--radius-lg)", border: "1.5px solid var(--border)" }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={{ borderRadius: "var(--radius-lg)", border: "1.5px solid var(--border)" }}
          />

          {/* ── Date selection ────────────────────────────────────────────── */}
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
                  className="text-[10px] font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "#dc2626" }}
                >
                  Remove repeating
                </button>
              )}
            </div>

            {/* Day picker (used for both create and edit) */}
            <DayPicker selectedDates={selectedDates} onToggle={toggleDay} />
          </div>

          {/* ── Times ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold">
              Start
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 text-sm outline-none"
                style={{ borderRadius: "var(--radius-lg)", border: "1.5px solid var(--border)" }}
              />
            </label>
            <label className="text-xs font-semibold">
              End
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 text-sm outline-none"
                style={{ borderRadius: "var(--radius-lg)", border: "1.5px solid var(--border)" }}
              />
            </label>
          </div>

          {/* ── Repeating ────────────────────────────────────────────────── */}
          {(!isEditing || seriesEvents.length <= 1) && (
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={repeats}
                  onChange={(e) => setRepeats(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                Repeat this event
              </label>

              {repeats && (
                <div className="flex items-center gap-3 animate-fade-in pl-6">
                  <select
                    value={repeatFreq}
                    onChange={(e) => setRepeatFreq(e.target.value as "daily" | "weekly" | "monthly")}
                    className="px-2 py-1.5 text-sm outline-none"
                    style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <span className="text-sm font-medium">for</span>
                  <input
                    type="number"
                    min="2"
                    max="52"
                    value={repeatCount}
                    onChange={(e) => setRepeatCount(parseInt(e.target.value) || 2)}
                    className="w-16 px-2 py-1.5 text-sm outline-none"
                    style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}
                  />
                  <span className="text-sm font-medium">
                    {repeatFreq === "daily" ? "days" : repeatFreq === "weekly" ? "weeks" : "months"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Tag picker ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
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
                      className="flex cursor-pointer items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-all duration-150"
                      style={{
                        borderRadius: "var(--radius-full)",
                        border:       `1.5px solid ${tag.color}`,
                        background:   active ? tag.color : "transparent",
                        color:        active ? "#fff" : tag.color,
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
            <p
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                background: "#fff5f5",
                border: "1.5px solid #fca5a5",
                color: "#b91c1c",
              }}
            >
              Overlaps with{" "}
              {softOverlap.titles.slice(0, 2).join(", ")}
              {softOverlap.titles.length > 2
                ? ` +${softOverlap.titles.length - 2} more`
                : ""}
              . You can still save. Conflicting events will be highlighted.
            </p>
          )}

          {error && (
            <p className="text-sm" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            {isEditing && onDelete ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDelete()}
                  className="cursor-pointer px-4 py-2 text-sm font-semibold disabled:opacity-60"
                  style={{
                    borderRadius: "var(--radius-lg)",
                    border:       "1.5px solid #fca5a5",
                    background:   confirmDelete ? "#dc2626" : "#fff5f5",
                    color:        confirmDelete ? "#fff" : "#dc2626",
                  }}
                >
                  {confirmDelete ? "Confirm delete" : "Delete"}
                </button>
                {event?.recurrence_group_id && onDeleteSeries && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleDeleteSeriesAction()}
                    className="cursor-pointer px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    style={{
                      borderRadius: "var(--radius-lg)",
                      border:       "1.5px solid #fca5a5",
                      background:   confirmDelete ? "#dc2626" : "#fff5f5",
                      color:        confirmDelete ? "#fff" : "#dc2626",
                    }}
                  >
                    {confirmDelete ? "Confirm delete series" : "Delete series"}
                  </button>
                )}
              </div>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-4 py-2 text-sm font-semibold"
                style={{ borderRadius: "var(--radius-lg)", border: "1.5px solid var(--border)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || (!isEditing && selectedDates.size === 0)}
                className="btn-bounce cursor-pointer px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ borderRadius: "var(--radius-lg)", background: "var(--accent)" }}
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
    </div>
  );
}
