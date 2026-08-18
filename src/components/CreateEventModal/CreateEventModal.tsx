"use client";

import { type FormEvent, useState } from "react";
import type { CalendarEvent } from "@/lib/events";
import { TagCreatorInline } from "@/components/TagCreatorInline";
import type { Tag } from "@/lib/tags";

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
  /** All tags available for this group */
  tags: Tag[];
  /** Tag IDs already assigned to this event (when editing) */
  initialTagIds?: string[];
  onClose: () => void;
  onCreate: (input: EventDraft) => Promise<void>;
  onUpdate?: (eventId: string, input: EventDraft) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
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

export function CreateEventModal({
  open,
  defaultDate,
  event = null,
  tags,
  initialTagIds = [],
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onCreateTag,
}: CreateEventModalProps) {
  const isEditing = Boolean(event);
  const start = event ? new Date(event.starts_at) : defaultDate;
  const end = event ? new Date(event.ends_at) : null;

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [date, setDate] = useState(toDateInput(start));
  const [startTime, setStartTime] = useState(
    event ? toTimeInput(start) : toTimeInput(defaultDate),
  );
  const defaultEnd = new Date(defaultDate.getTime() + 60 * 60 * 1000);
  const [endTime, setEndTime] = useState(end ? toTimeInput(end) : toTimeInput(defaultEnd));
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  function parseRange(): EventDraft | null {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const [year, month, day] = date.split("-").map(Number);

    const startsAt = new Date(year!, month! - 1, day!, sh!, sm!, 0);
    const endsAt = new Date(year!, month! - 1, day!, eh!, em!, 0);

    if (endsAt <= startsAt) {
      setError("End time must be after start time.");
      return null;
    }

    return {
      title: title.trim(),
      description: description.trim(),
      startsAt,
      endsAt,
      tagIds: selectedTagIds,
    };
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setBusy(true);
    setError(null);
    setConfirmDelete(false);

    try {
      const draft = parseRange();
      if (!draft) return;

      if (isEditing && event && onUpdate) {
        await onUpdate(event.id, draft);
      } else {
        await onCreate(draft);
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditing
            ? "Could not update event."
            : "Could not create event.",
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
          background: "var(--surface)",
          boxShadow: "var(--shadow-lg)",
          border: "1.5px solid var(--border)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold"
          style={{
            fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
          }}
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
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1.5px solid var(--border)",
            }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1.5px solid var(--border)",
            }}
          />
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1.5px solid var(--border)",
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold">
              Start
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 text-sm outline-none"
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--border)",
                }}
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
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--border)",
                }}
              />
            </label>
          </div>

          {/* Tag picker */}
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

          {error && (
            <p className="text-sm" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            {isEditing && onDelete ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDelete()}
                className="cursor-pointer px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid #fca5a5",
                  background: confirmDelete ? "#dc2626" : "#fff5f5",
                  color: confirmDelete ? "#fff" : "#dc2626",
                }}
              >
                {confirmDelete ? "Confirm delete" : "Delete"}
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-4 py-2 text-sm font-semibold"
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--border)",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="btn-bounce cursor-pointer px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{
                  borderRadius: "var(--radius-lg)",
                  background: "var(--accent)",
                }}
              >
                {busy ? "Saving…" : isEditing ? "Save changes" : "Save event"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
