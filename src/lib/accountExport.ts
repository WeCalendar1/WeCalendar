import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type AccountExportBundle = {
  exportedAt: string;
  user: {
    id: string;
    email: string | null;
  };
  profile: Tables<"profiles"> | null;
  groups: Tables<"groups">[];
  events: Tables<"events">[];
  tags: Tables<"tags">[];
  eventTags: Tables<"event_tags">[];
  noteFolders: Tables<"note_folders">[];
  notes: Tables<"notes">[];
  lists: Tables<"lists">[];
  listItems: Tables<"list_items">[];
};

export function serializeAccountExport(bundle: AccountExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function formatExportFilename(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `wecalendar-export-${yyyy}-${mm}-${dd}.json`;
}

export function triggerJsonDownload(filename: string, json: string): void {
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function fetchAccountExportBundle(
  supabase: SupabaseClient<Database>,
  user: { id: string; email?: string | null },
  exportedAt: string = new Date().toISOString(),
): Promise<AccountExportBundle> {
  const [profileRes, membershipsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("group_members").select("group_id").eq("user_id", user.id),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (membershipsRes.error) throw membershipsRes.error;

  const groupIds = [...new Set((membershipsRes.data ?? []).map((m) => m.group_id))];

  if (groupIds.length === 0) {
    return {
      exportedAt,
      user: { id: user.id, email: user.email ?? null },
      profile: profileRes.data ?? null,
      groups: [],
      events: [],
      tags: [],
      eventTags: [],
      noteFolders: [],
      notes: [],
      lists: [],
      listItems: [],
    };
  }

  const [groupsRes, eventsRes, tagsRes, noteFoldersRes, notesRes, listsRes] =
    await Promise.all([
      supabase.from("groups").select("*").in("id", groupIds),
      supabase.from("events").select("*").in("group_id", groupIds),
      supabase.from("tags").select("*").in("group_id", groupIds),
      supabase.from("note_folders").select("*").in("group_id", groupIds),
      supabase.from("notes").select("*").in("group_id", groupIds),
      supabase.from("lists").select("*").in("group_id", groupIds),
    ]);

  if (groupsRes.error) throw groupsRes.error;
  if (eventsRes.error) throw eventsRes.error;
  if (tagsRes.error) throw tagsRes.error;
  if (noteFoldersRes.error) throw noteFoldersRes.error;
  if (notesRes.error) throw notesRes.error;
  if (listsRes.error) throw listsRes.error;

  const events = eventsRes.data ?? [];
  const lists = listsRes.data ?? [];
  const eventIds = events.map((e) => e.id);
  const listIds = lists.map((l) => l.id);

  const [eventTagsRes, listItemsRes] = await Promise.all([
    eventIds.length > 0
      ? supabase.from("event_tags").select("*").in("event_id", eventIds)
      : Promise.resolve({ data: [] as Tables<"event_tags">[], error: null }),
    listIds.length > 0
      ? supabase.from("list_items").select("*").in("list_id", listIds)
      : Promise.resolve({ data: [] as Tables<"list_items">[], error: null }),
  ]);

  if (eventTagsRes.error) throw eventTagsRes.error;
  if (listItemsRes.error) throw listItemsRes.error;

  return {
    exportedAt,
    user: { id: user.id, email: user.email ?? null },
    profile: profileRes.data ?? null,
    groups: groupsRes.data ?? [],
    events,
    tags: tagsRes.data ?? [],
    eventTags: eventTagsRes.data ?? [],
    noteFolders: noteFoldersRes.data ?? [],
    notes: notesRes.data ?? [],
    lists,
    listItems: listItemsRes.data ?? [],
  };
}

