import type { Tables } from "@/types/database";

export type RsvpStatus = "going" | "maybe" | "declined";

export type EventRsvp = Pick<
  Tables<"event_rsvps">,
  "event_id" | "group_id" | "user_id" | "status" | "updated_at"
>;

export type RsvpMemberSummary = {
  userId: string;
  displayName: string;
  isCurrentUser: boolean;
  avatarUrl: string | null;
  status: RsvpStatus;
};

const STATUS_ORDER: Record<RsvpStatus, number> = {
  going: 0,
  maybe: 1,
  declined: 2,
};

export function isRsvpStatus(value: unknown): value is RsvpStatus {
  return value === "going" || value === "maybe" || value === "declined";
}

export function rsvpMapForUser(
  rsvps: readonly EventRsvp[],
  userId: string | null | undefined,
): Map<string, RsvpStatus> {
  const map = new Map<string, RsvpStatus>();
  if (!userId) return map;

  for (const rsvp of rsvps) {
    if (rsvp.user_id === userId && isRsvpStatus(rsvp.status)) {
      map.set(rsvp.event_id, rsvp.status);
    }
  }
  return map;
}

export function summarizeEventRsvps(
  eventId: string,
  rsvps: readonly EventRsvp[],
  profilesById: ReadonlyMap<
    string,
    { display_name: string | null; avatar_url?: string | null }
  >,
  currentUserId?: string | null,
): {
  myStatus: RsvpStatus | null;
  counts: { going: number; maybe: number; declined: number };
  respondents: RsvpMemberSummary[];
} {
  const counts = { going: 0, maybe: 0, declined: 0 };
  const respondents: RsvpMemberSummary[] = [];
  let myStatus: RsvpStatus | null = null;

  for (const r of rsvps) {
    if (r.event_id !== eventId || !isRsvpStatus(r.status)) continue;
    counts[r.status] += 1;

    const isCurrentUser = Boolean(currentUserId && currentUserId === r.user_id);
    if (isCurrentUser) {
      myStatus = r.status;
    }

    const profile = profilesById.get(r.user_id);
    const rawName = profile?.display_name?.trim();
    const displayName = isCurrentUser ? "You" : rawName || "Member";

    respondents.push({
      userId: r.user_id,
      displayName,
      isCurrentUser,
      avatarUrl: profile?.avatar_url ?? null,
      status: r.status,
    });
  }

  respondents.sort((a, b) => {
    if (a.isCurrentUser !== b.isCurrentUser) return a.isCurrentUser ? -1 : 1;
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.displayName.localeCompare(b.displayName);
  });

  return { myStatus, counts, respondents };
}

export function filterVisibleEvents<T extends { myRsvp?: RsvpStatus | null }>(
  events: readonly T[],
  showDeclinedEvents: boolean,
): T[] {
  if (showDeclinedEvents) return [...events];
  return events.filter((event) => event.myRsvp !== "declined");
}

export function filterConflictCandidateEvents<
  T extends { ends_at: string; myRsvp?: RsvpStatus | null },
>(
  events: readonly T[],
  options: { hidePastConflicts: boolean; nowMs?: number },
): T[] {
  const cutoffMs =
    options.nowMs ??
    (() => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return start.getTime();
    })();

  return events.filter((event) => {
    if (event.myRsvp === "declined") return false;
    if (options.hidePastConflicts && new Date(event.ends_at).getTime() <= cutoffMs) {
      return false;
    }
    return true;
  });
}
