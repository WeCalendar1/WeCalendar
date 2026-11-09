import type { Tables } from "@/types/database";

export type CalendarSync = Tables<"calendar_syncs">;
export type CalendarSyncProvider = CalendarSync["provider"];

export const PROVIDER_LABEL: Record<CalendarSyncProvider, string> = {
  google: "Google Calendar",
  outlook: "Outlook",
  apple: "Apple Calendar",
  ics: "iCal (.ics)",
};

export type LocalCalendarSync = CalendarSync & {
  imported_event_ids?: string[];
};

export type ParsedIcsEvent = {
  externalUid: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
};

const LOCAL_SYNC_STORAGE_PREFIX = "wecalendar:calendar-syncs:";

export function isPrivateOrReservedIp(rawHost: string): boolean {
  const host = rawHost.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return true;

  // IPv6 checks
  if (host.includes(":")) {
    if (
      host === "::" ||
      host === "::1" ||
      host.startsWith("fe80:") ||
      host.startsWith("fe9") ||
      host.startsWith("fea") ||
      host.startsWith("feb") ||
      host.startsWith("fc") ||
      host.startsWith("fd") ||
      host.startsWith("ff") ||
      host.startsWith("100::") ||
      host.startsWith("0100:") ||
      host.startsWith("2001:db8:") ||
      host.startsWith("2001:0db8:")
    ) {
      return true;
    }
    const v4Mapped = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (v4Mapped) {
      return isPrivateOrReservedIp(v4Mapped[1]!);
    }
    return false;
  }

  // IPv4 checks
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) {
    // Reject numeric/octal/hex IP encodings where all labels are digits/hex
    if (/^[0-9x.]+$/i.test(host)) return true;
    return false;
  }

  const octets = ipv4Match.slice(1, 5).map((n) => Number(n));
  if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b, c] = octets as [number, number, number, number];

  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // RFC 6598 CGNAT
  if (a === 169 && b === 254) return true; // Link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC 1918
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
  if (a === 192 && b === 168) return true; // RFC 1918
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return true;
  if (a === 203 && b === 0 && c === 113) return true;
  if (a >= 224) return true; // Multicast & reserved

  return false;
}

export function validateExternalIcsUrl(
  rawUrl: string,
): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { ok: false, error: "Please enter a calendar .ics URL." };
  }

  const normalized = trimmed.replace(/^webcals?:\/\//i, "https://");
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { ok: false, error: "Invalid calendar URL format." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Calendar URL must use https:// or webcal://." };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: "Calendar URL must not contain embedded credentials." };
  }

  if (parsed.port !== "" && parsed.port !== "443") {
    return { ok: false, error: "Calendar URL must use the standard HTTPS port (443)." };
  }

  const host = parsed.hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (
    !host ||
    host.includes(":") ||
    !host.includes(".") ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    isPrivateOrReservedIp(host)
  ) {
    return { ok: false, error: "Calendar URL must point to a public hostname." };
  }

  return { ok: true, url: parsed.toString() };
}

export function detectCalendarProvider(input: string): CalendarSyncProvider {
  const lower = input.toLowerCase();
  if (lower.includes("google.com") || lower.includes("google") || lower.includes("gmail")) {
    return "google";
  }
  if (
    lower.includes("outlook.") ||
    lower.includes("office365.") ||
    lower.includes("live.com") ||
    lower.includes("microsoft") ||
    lower.includes("outlook")
  ) {
    return "outlook";
  }
  if (lower.includes("icloud.com") || lower.includes("apple.com") || lower.includes("apple")) {
    return "apple";
  }
  return "ics";
}

function unfoldIcsLines(icsText: string): string[] {
  const unfolded = icsText.replace(/\r?\n[ \t]/g, "");
  return unfolded.split(/\r?\n/);
}

function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function parseIcsDateProperty(
  propKey: string,
  propValue: string,
): { date: Date; isDateOnly: boolean } | null {
  const upperKey = propKey.toUpperCase();
  const val = propValue.trim();
  const isDateOnly = upperKey.includes("VALUE=DATE") || /^\d{8}$/.test(val);

  if (isDateOnly) {
    const m = val.match(/^(\d{4})(\d{2})(\d{2})/);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    const day = Number(m[3]);
    const date = new Date(year, month, day, 0, 0, 0, 0);
    if (Number.isNaN(date.getTime())) return null;
    return { date, isDateOnly: true };
  }

  const dtMatch = val.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/i);
  if (dtMatch) {
    const year = Number(dtMatch[1]);
    const month = Number(dtMatch[2]) - 1;
    const day = Number(dtMatch[3]);
    const hour = Number(dtMatch[4]);
    const minute = Number(dtMatch[5]);
    const second = Number(dtMatch[6]);
    const isUtc = Boolean(dtMatch[7]);
    const date = isUtc
      ? new Date(Date.UTC(year, month, day, hour, minute, second, 0))
      : new Date(year, month, day, hour, minute, second, 0);
    if (Number.isNaN(date.getTime())) return null;
    return { date, isDateOnly: false };
  }

  const fallback = new Date(val);
  if (!Number.isNaN(fallback.getTime())) {
    return { date: fallback, isDateOnly: false };
  }
  return null;
}

function deterministicUid(title: string, startsAt: string, endsAt: string): string {
  const input = `${title}|${startsAt}|${endsAt}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `ics-${(hash >>> 0).toString(16)}`;
}

export function extractIcsCalendarName(icsText: string): string | null {
  for (const line of unfoldIcsLines(icsText)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx <= 0) continue;
    const rawKey = line.slice(0, colonIdx).split(";")[0]?.trim().toUpperCase();
    if (rawKey === "X-WR-CALNAME") {
      const name = unescapeIcsText(line.slice(colonIdx + 1));
      return name || null;
    }
  }
  return null;
}

export function parseIcsEvents(icsText: string, maxEvents = 500): ParsedIcsEvent[] {
  const lines = unfoldIcsLines(icsText);
  const events: ParsedIcsEvent[] = [];
  const usedUids = new Set<string>();

  let inEvent = false;
  let subComponentDepth = 0;
  let uid = "";
  let recurrenceId = "";
  let summary = "";
  let description = "";
  let status = "";
  let dtStartKey = "";
  let dtStartVal = "";
  let dtEndKey = "";
  let dtEndVal = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const upperLine = line.toUpperCase();

    if (upperLine === "BEGIN:VEVENT") {
      inEvent = true;
      subComponentDepth = 0;
      uid = "";
      recurrenceId = "";
      summary = "";
      description = "";
      status = "";
      dtStartKey = "";
      dtStartVal = "";
      dtEndKey = "";
      dtEndVal = "";
      continue;
    }

    if (upperLine === "END:VEVENT") {
      if (inEvent && status.toUpperCase() !== "CANCELLED" && dtStartVal) {
        const startParsed = parseIcsDateProperty(dtStartKey, dtStartVal);
        if (startParsed) {
          let endDate: Date;
          const endParsed = dtEndVal ? parseIcsDateProperty(dtEndKey, dtEndVal) : null;

          if (startParsed.isDateOnly) {
            if (endParsed && endParsed.date.getTime() > startParsed.date.getTime()) {
              // RFC 5545 exclusive DTEND;VALUE=DATE -> inclusive local 23:59:00 on previous day
              endDate = new Date(
                endParsed.date.getFullYear(),
                endParsed.date.getMonth(),
                endParsed.date.getDate() - 1,
                23,
                59,
                0,
                0,
              );
            } else {
              endDate = new Date(
                startParsed.date.getFullYear(),
                startParsed.date.getMonth(),
                startParsed.date.getDate(),
                23,
                59,
                0,
                0,
              );
            }
          } else if (endParsed && endParsed.date.getTime() >= startParsed.date.getTime()) {
            endDate = endParsed.date;
          } else {
            endDate = new Date(startParsed.date.getTime() + 60 * 60 * 1000);
          }

          const title = summary ? unescapeIcsText(summary) : "Busy";
          const desc = description ? unescapeIcsText(description) : null;
          const startsAt = startParsed.date.toISOString();
          const endsAt = endDate.toISOString();
          const baseUid = uid
            ? unescapeIcsText(uid)
            : deterministicUid(title, startsAt, endsAt);
          const candidateUid = recurrenceId
            ? `${baseUid}#${unescapeIcsText(recurrenceId)}`
            : baseUid;
          let externalUid = candidateUid;
          let dupIdx = 1;
          while (usedUids.has(externalUid)) {
            externalUid = `${candidateUid}#${startsAt}#${dupIdx++}`;
          }
          usedUids.add(externalUid);

          events.push({
            externalUid,
            title,
            description: desc || null,
            startsAt,
            endsAt,
          });
        }
      }
      inEvent = false;
      if (events.length >= maxEvents) break;
      continue;
    }

    if (!inEvent) continue;
    if (upperLine.startsWith("BEGIN:")) {
      subComponentDepth++;
      continue;
    }
    if (upperLine.startsWith("END:")) {
      subComponentDepth = Math.max(0, subComponentDepth - 1);
      continue;
    }
    if (subComponentDepth > 0) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx <= 0) continue;

    const fullKey = line.slice(0, colonIdx).trim();
    const baseKey = fullKey.split(";")[0]?.trim().toUpperCase() ?? "";
    const value = line.slice(colonIdx + 1);

    if (baseKey === "UID") uid = value;
    else if (baseKey === "RECURRENCE-ID") recurrenceId = value;
    else if (baseKey === "SUMMARY") summary = value;
    else if (baseKey === "DESCRIPTION") description = value;
    else if (baseKey === "STATUS") status = value;
    else if (baseKey === "DTSTART") {
      dtStartKey = fullKey;
      dtStartVal = value;
    } else if (baseKey === "DTEND") {
      dtEndKey = fullKey;
      dtEndVal = value;
    }
  }

  return events;
}

function formatUtcIcsTimestamp(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

export function serializeEventsToIcs(
  events: readonly Pick<
    Tables<"events">,
    "id" | "title" | "description" | "starts_at" | "ends_at" | "updated_at"
  >[],
  calendarName = "WeCalendar",
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WeCalendar//Shared Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];

  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${escapeIcsText(`${ev.id}@wecalendar.app`)}`);
    lines.push(`DTSTAMP:${formatUtcIcsTimestamp(ev.updated_at || ev.starts_at)}`);
    lines.push(`DTSTART:${formatUtcIcsTimestamp(ev.starts_at)}`);
    lines.push(`DTEND:${formatUtcIcsTimestamp(ev.ends_at)}`);
    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
    if (ev.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

export function triggerIcsDownload(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function readLocalCalendarSyncs(userId: string): LocalCalendarSync[] {
  if (typeof localStorage === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_SYNC_STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalCalendarSync[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalCalendarSyncs(
  userId: string,
  syncs: readonly LocalCalendarSync[],
): void {
  if (typeof localStorage === "undefined" || !userId) return;
  try {
    localStorage.setItem(`${LOCAL_SYNC_STORAGE_PREFIX}${userId}`, JSON.stringify(syncs));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearLocalCalendarSyncs(userId: string): number {
  const existing = readLocalCalendarSyncs(userId);
  if (typeof localStorage !== "undefined" && userId) {
    try {
      localStorage.removeItem(`${LOCAL_SYNC_STORAGE_PREFIX}${userId}`);
    } catch {
      // Ignore storage errors
    }
  }
  return existing.length;
}
