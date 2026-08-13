/** True when Postgres/PostgREST rejected a write for overlapping event times. */
export function isSchedulingConflictError(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  if (error.code === "23P01") return true;
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("events_no_overlapping_time") ||
    message.includes("exclusion constraint") ||
    message.includes("conflicting key value")
  );
}

export const SCHEDULING_CONFLICT_MESSAGE =
  "Scheduling conflict: that time overlaps an existing shared event. The first booking keeps the slot - pick a different time.";
