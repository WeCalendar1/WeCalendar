import { isRsvpStatus, type EventRsvp } from "@/lib/rsvps";
import type { Tables } from "@/types/database";

export type NotificationCategory = "events" | "invites" | "lists" | "nudges";
export type NotificationPrefs = Record<NotificationCategory, boolean>;
export type AppNotification = Tables<"notifications">;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  events: true,
  invites: true,
  lists: false,
  nudges: true,
};

const LOCAL_NOTIFICATION_PREFS_KEY = "wecalendar.pref.notifications";

export function normalizeNotificationPrefs(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
  const obj = raw as Record<string, unknown>;
  return {
    events: typeof obj.events === "boolean" ? obj.events : DEFAULT_NOTIFICATION_PREFS.events,
    invites: typeof obj.invites === "boolean" ? obj.invites : DEFAULT_NOTIFICATION_PREFS.invites,
    lists: typeof obj.lists === "boolean" ? obj.lists : DEFAULT_NOTIFICATION_PREFS.lists,
    nudges: typeof obj.nudges === "boolean" ? obj.nudges : DEFAULT_NOTIFICATION_PREFS.nudges,
  };
}

export function readLocalNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_NOTIFICATION_PREFS };
  try {
    const raw = window.localStorage.getItem(LOCAL_NOTIFICATION_PREFS_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    return normalizeNotificationPrefs(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export function writeLocalNotificationPrefs(prefs: NotificationPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LOCAL_NOTIFICATION_PREFS_KEY,
      JSON.stringify(normalizeNotificationPrefs(prefs)),
    );
  } catch {
    // Ignore storage quota or private-mode failures
  }
}

export function isMissingColumnOrRelationError(
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205"
  );
}

export function countUnreadNotifications(
  items: readonly Pick<AppNotification, "read_at">[],
): number {
  let count = 0;
  for (const item of items) {
    if (!item.read_at) count += 1;
  }
  return count;
}

export function formatNotificationRelativeTime(
  createdAtIso: string,
  nowMs: number = Date.now(),
): string {
  const createdMs = new Date(createdAtIso).getTime();
  if (!Number.isFinite(createdMs)) return "";
  const diffSec = Math.max(0, Math.floor((nowMs - createdMs) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(createdMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function unansweredMemberIdsForEvent(
  eventId: string,
  memberIds: readonly string[],
  rsvps: readonly Pick<EventRsvp, "event_id" | "user_id" | "status">[],
  currentUserId?: string | null,
): string[] {
  const respondedUserIds = new Set<string>();
  for (const row of rsvps) {
    if (row.event_id === eventId && isRsvpStatus(row.status)) {
      respondedUserIds.add(row.user_id);
    }
  }

  const uniqueUnanswered: string[] = [];
  const seen = new Set<string>();
  for (const memberId of memberIds) {
    if (seen.has(memberId)) continue;
    seen.add(memberId);
    if (currentUserId && memberId === currentUserId) continue;
    if (respondedUserIds.has(memberId)) continue;
    uniqueUnanswered.push(memberId);
  }
  return uniqueUnanswered;
}
