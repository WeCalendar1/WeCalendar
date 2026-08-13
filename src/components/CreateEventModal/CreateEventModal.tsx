"use client";

import { type FormEvent, useState } from "react";

type CreateEventModalProps = {
  open: boolean;
  defaultDate: Date;
  onClose: () => void;
  onCreate: (input: {
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
  }) => Promise<void>;
};

function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function CreateEventModal({
  open,
  defaultDate,
  onClose,
  onCreate,
}: CreateEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(toDateInput(defaultDate));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);


  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const [year, month, day] = date.split("-").map(Number);

      const startsAt = new Date(year!, month! - 1, day!, sh!, sm!, 0);
      const endsAt = new Date(year!, month! - 1, day!, eh!, em!, 0);

      if (endsAt <= startsAt) {
        setError("End time must be after start time.");
        return;
      }

      await onCreate({
        title: title.trim(),
        description: description.trim(),
        startsAt,
        endsAt,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event.");
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold"
          style={{
            fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
          }}
        >
          Create shared event
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          This event syncs to everyone in the workspace.
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

          {error && (
            <p className="text-sm" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
              {busy ? "Saving…" : "Save event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
