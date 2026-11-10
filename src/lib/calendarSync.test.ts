import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  PROVIDER_LABEL,
  clearLocalCalendarSyncs,
  detectCalendarProvider,
  extractIcsCalendarName,
  isPrivateOrReservedIp,
  parseIcsEvents,
  readLocalCalendarSyncs,
  selectPinnedLookupAddresses,
  serializeEventsToIcs,
  validateExternalIcsUrl,
  writeLocalCalendarSyncs,
} from "./calendarSync";

describe("validateExternalIcsUrl", () => {
  it("normalizes webcal:// to https:// and accepts public HTTPS calendar feeds", () => {
    const res1 = validateExternalIcsUrl(
      "webcal://calendar.google.com/calendar/ical/test%40gmail.com/public/basic.ics",
    );
    expect(res1).toEqual({
      ok: true,
      url: "https://calendar.google.com/calendar/ical/test%40gmail.com/public/basic.ics",
    });

    const res2 = validateExternalIcsUrl("https://outlook.live.com/owa/calendar/123/reachcalendar.ics");
    expect(res2).toEqual({
      ok: true,
      url: "https://outlook.live.com/owa/calendar/123/reachcalendar.ics",
    });
  });

  it("rejects non-HTTPS protocols, credentials, custom ports, and private/loopback/link-local hosts", () => {
    const invalidInputs = [
      "",
      "http://calendar.google.com/basic.ics",
      "ftp://example.com/basic.ics",
      "https://user:pass@example.com/basic.ics",
      "https://example.com:8443/basic.ics",
      "https://localhost/basic.ics",
      "https://sub.localhost/basic.ics",
      "https://internal.local/basic.ics",
      "https://127.0.0.1/basic.ics",
      "https://10.0.0.1/basic.ics",
      "https://172.16.0.1/basic.ics",
      "https://172.31.255.255/basic.ics",
      "https://192.168.1.1/basic.ics",
      "https://169.254.169.254/latest/meta-data/",
      "https://0.0.0.0/basic.ics",
      "https://[::1]/basic.ics",
      "https://[fe80::1]/basic.ics",
      "https://[fd00::1]/basic.ics",
    ];

    for (const input of invalidInputs) {
      const result = validateExternalIcsUrl(input);
      expect(result.ok, `expected ${input} to be rejected`).toBe(false);
    }
  });

  it("allows public global unicast IPv6 addresses in isPrivateOrReservedIp for dual-stack DNS while blocking private/reserved IPv6", () => {
    expect(isPrivateOrReservedIp("2607:f8b0:4005:805::200e")).toBe(false);
    expect(isPrivateOrReservedIp("2a01:111:f400:5299::2")).toBe(false);
    expect(isPrivateOrReservedIp("::1")).toBe(true);
    expect(isPrivateOrReservedIp("fe80::1")).toBe(true);
    expect(isPrivateOrReservedIp("fd00::1")).toBe(true);
    expect(isPrivateOrReservedIp("2001:db8::1")).toBe(true);
    expect(isPrivateOrReservedIp("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("::ffff:8.8.8.8")).toBe(false);
  });

  it("pins validated DNS addresses and blocks DNS responses containing any private/reserved IP", () => {
    expect(selectPinnedLookupAddresses([])).toEqual({
      ok: false,
      code: "ENOTFOUND",
      message: "Could not resolve calendar hostname.",
    });

    expect(
      selectPinnedLookupAddresses([
        { address: "142.250.189.206", family: 4 },
        { address: "127.0.0.1", family: 4 },
      ]),
    ).toEqual({
      ok: false,
      code: "ESSRFBLOCKED",
      message: "Calendar URL resolves to a restricted network address.",
    });

    expect(
      selectPinnedLookupAddresses([
        { address: "142.250.189.206", family: 4 },
        { address: "2607:f8b0:4005:805::200e", family: 6 },
      ]),
    ).toEqual({
      ok: true,
      addresses: [
        { address: "142.250.189.206", family: 4 },
        { address: "2607:f8b0:4005:805::200e", family: 6 },
      ],
    });
  });
});

describe("detectCalendarProvider", () => {
  it("detects google, outlook, apple, and generic ics providers", () => {
    expect(
      detectCalendarProvider("https://calendar.google.com/calendar/ical/abc/basic.ics"),
    ).toBe("google");
    expect(
      detectCalendarProvider("https://outlook.office365.com/owa/calendar/abc/calendar.ics"),
    ).toBe("outlook");
    expect(
      detectCalendarProvider("webcal://p12-caldav.icloud.com/published/2/abc"),
    ).toBe("apple");
    expect(detectCalendarProvider("https://example.org/team.ics")).toBe("ics");
  });
});

describe("parseIcsEvents & extractIcsCalendarName", () => {
  it("unfolds RFC 5545 folded lines, unescapes text, skips cancelled events, and parses UTC & all-day events", () => {
    const sampleIcs = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "X-WR-CALNAME:Team\\, Schedule & Ops",
      "BEGIN:VEVENT",
      "UID:evt-utc-1@example.com",
      "SUMMARY:Sprint\\, Planning\\; Review",
      "DESCRIPTION:Line 1\\nLine ",
      " 2 continued",
      "DTSTART:20261110T170000Z",
      "DTEND:20261110T183000Z",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:evt-allday-1@example.com",
      "SUMMARY:Company Holiday",
      "DTSTART;VALUE=DATE:20261112",
      "DTEND;VALUE=DATE:20261113",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:evt-cancelled@example.com",
      "STATUS:CANCELLED",
      "SUMMARY:Cancelled Sync",
      "DTSTART:20261115T100000Z",
      "DTEND:20261115T110000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    expect(extractIcsCalendarName(sampleIcs)).toBe("Team, Schedule & Ops");

    const parsed = parseIcsEvents(sampleIcs);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({
      externalUid: "evt-utc-1@example.com",
      title: "Sprint, Planning; Review",
      description: "Line 1\nLine 2 continued",
      startsAt: "2026-11-10T17:00:00.000Z",
      endsAt: "2026-11-10T18:30:00.000Z",
    });

    const holidayStart = new Date(parsed[1]!.startsAt);
    const holidayEnd = new Date(parsed[1]!.endsAt);
    expect(holidayStart.getFullYear()).toBe(2026);
    expect(holidayStart.getMonth()).toBe(10); // Nov
    expect(holidayStart.getDate()).toBe(12);
    expect(holidayEnd.getFullYear()).toBe(2026);
    expect(holidayEnd.getMonth()).toBe(10);
    expect(holidayEnd.getDate()).toBe(12);
    expect(holidayEnd.getHours()).toBe(23);
    expect(holidayEnd.getMinutes()).toBe(59);
  });

  it("generates a deterministic fallback UID when VEVENT omits UID", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "SUMMARY:No UID Event",
      "DTSTART:20261120T120000Z",
      "DTEND:20261120T130000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    const first = parseIcsEvents(ics);
    const second = parseIcsEvents(ics);
    expect(first).toHaveLength(1);
    expect(first[0]!.externalUid).toBeTruthy();
    expect(first[0]!.externalUid).toBe(second[0]!.externalUid);
  });

  it("disambiguates duplicate UIDs across recurring VEVENT instances in the same feed and exposes PROVIDER_LABEL", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:series-1@example.com",
      "SUMMARY:Weekly Sync",
      "DTSTART:20261110T150000Z",
      "DTEND:20261110T160000Z",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:series-1@example.com",
      "RECURRENCE-ID:20261117T150000Z",
      "SUMMARY:Weekly Sync",
      "DTSTART:20261117T150000Z",
      "DTEND:20261117T160000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const parsed = parseIcsEvents(ics);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]!.externalUid).not.toBe(parsed[1]!.externalUid);
    expect(PROVIDER_LABEL.google).toBe("Google Calendar");
  });

  it("ignores nested VALARM properties so alarm DESCRIPTION does not overwrite VEVENT DESCRIPTION", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:alarm-evt-1@example.com",
      "SUMMARY:Team Standup",
      "DESCRIPTION:Discuss weekly progress and blockers.",
      "DTSTART:20261110T170000Z",
      "DTEND:20261110T173000Z",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder",
      "TRIGGER:-PT15M",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const parsed = parseIcsEvents(ics);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]!.description).toBe("Discuss weekly progress and blockers.");
  });

  it("converts timed DTSTART/DTEND with IANA or Windows TZID to exact UTC timestamps instead of browser local zone", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:tz-iana-1@example.com",
      "SUMMARY:NYC Morning Standup (EST, UTC-5)",
      "DTSTART;TZID=America/New_York:20261110T090000",
      "DTEND;TZID=\"America/New_York\":20261110T103000",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:tz-win-1@example.com",
      "SUMMARY:NYC Summer Sync (EDT, UTC-4)",
      "DTSTART;TZID=Eastern Standard Time:20260710T090000",
      "DTEND;TZID=Eastern Standard Time:20260710T100000",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const parsed = parseIcsEvents(ics);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]!.startsAt).toBe("2026-11-10T14:00:00.000Z");
    expect(parsed[0]!.endsAt).toBe("2026-11-10T15:30:00.000Z");
    expect(parsed[1]!.startsAt).toBe("2026-07-10T13:00:00.000Z");
    expect(parsed[1]!.endsAt).toBe("2026-07-10T14:00:00.000Z");
  });

  it("falls back to calendar-level X-WR-TIMEZONE for timed events without per-property TZID or Z", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "X-WR-TIMEZONE:America/New_York",
      "BEGIN:VEVENT",
      "UID:tz-cal-level-1@example.com",
      "SUMMARY:Calendar TZ Event",
      "DTSTART:20261110T090000",
      "DTEND:20261110T100000",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const parsed = parseIcsEvents(ics);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]!.startsAt).toBe("2026-11-10T14:00:00.000Z");
    expect(parsed[0]!.endsAt).toBe("2026-11-10T15:00:00.000Z");
  });
});

describe("serializeEventsToIcs", () => {
  it("serializes workspace events to valid RFC 5545 .ics and round-trips through parseIcsEvents", () => {
    const ics = serializeEventsToIcs(
      [
        {
          id: "evt-100",
          title: "Product Demo, Q4",
          description: "Bring slides\nand notes",
          starts_at: "2026-11-15T18:00:00.000Z",
          ends_at: "2026-11-15T19:00:00.000Z",
          updated_at: "2026-11-08T12:00:00.000Z",
        },
      ],
      "WeCalendar Shared",
    );

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("X-WR-CALNAME:WeCalendar Shared");
    expect(extractIcsCalendarName(ics)).toBe("WeCalendar Shared");

    const roundTripped = parseIcsEvents(ics);
    expect(roundTripped).toEqual([
      {
        externalUid: "evt-100@wecalendar.app",
        title: "Product Demo, Q4",
        description: "Bring slides\nand notes",
        startsAt: "2026-11-15T18:00:00.000Z",
        endsAt: "2026-11-15T19:00:00.000Z",
      },
    ]);
  });
});

describe("local calendar sync fallback storage & migration invariants", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
      },
      configurable: true,
    });
  });

  it("reads, writes, and clears local calendar syncs per user", () => {
    expect(readLocalCalendarSyncs("u1")).toEqual([]);
    writeLocalCalendarSyncs("u1", [
      {
        id: "local-1",
        group_id: "g1",
        user_id: "u1",
        provider: "google",
        label: "Google Work",
        source_url: "https://calendar.google.com/calendar/ical/work/basic.ics",
        last_synced_at: "2026-11-08T00:00:00.000Z",
        synced_event_count: 4,
        created_at: "2026-11-08T00:00:00.000Z",
        updated_at: "2026-11-08T00:00:00.000Z",
        imported_event_ids: ["e1", "e2"],
      },
    ]);

    expect(readLocalCalendarSyncs("u1")).toHaveLength(1);
    expect(clearLocalCalendarSyncs("u1")).toBe(1);
    expect(readLocalCalendarSyncs("u1")).toEqual([]);
  });

  it("declares REPLICA IDENTITY FULL, unsync_my_calendars, and same-group trigger in 20261108210000_calendar_sync.sql", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20261108210000_calendar_sync.sql"),
      "utf8",
    );
    expect(sql).toMatch(/alter table public\.calendar_syncs replica identity full/i);
    expect(sql).toMatch(/create or replace function public\.unsync_my_calendars/i);
    expect(sql).toMatch(/create trigger events_enforce_sync_same_group/i);

    const grantsSql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20261109160000_calendar_syncs_grants.sql"),
      "utf8",
    );
    expect(grantsSql).toMatch(
      /grant\s+select,\s*insert,\s*update,\s*delete\s+on\s+(table\s+)?public\.calendar_syncs\s+to\s+authenticated/i,
    );
  });
});
