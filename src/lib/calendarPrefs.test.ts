import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPrefsSnapshot,
  getServerPrefsSnapshot,
  PREF_EVENT,
  setCalendarPref,
} from "./calendarPrefs";

describe("calendarPrefs store", () => {
  const store = new Map<string, string>();
  const dispatchEvent = vi.fn();

  beforeEach(() => {
    store.clear();
    dispatchEvent.mockReset();
    const mockStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    };
    vi.stubGlobal("localStorage", mockStorage);
    vi.stubGlobal("window", { localStorage: mockStorage, dispatchEvent });
    vi.stubGlobal(
      "Event",
      class MockEvent {
        type: string;
        constructor(type: string) {
          this.type = type;
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns server defaults when storage is empty or invalid and caches snapshot reference", () => {
    store.set("wecalendar.pref.defaultView", "agenda");
    store.set("wecalendar.pref.weekStartsOnMonday", "yes");

    const first = getPrefsSnapshot();
    const second = getPrefsSnapshot();

    expect(first).toBe(second);
    expect(first).toEqual(getServerPrefsSnapshot());
    expect(first.defaultView).toBe("month");
    expect(first.weekStartsOnMonday).toBe(false);
  });

  it("updates stored values, returns a fresh snapshot, and dispatches PREF_EVENT", () => {
    const before = getPrefsSnapshot();
    setCalendarPref("weekStartsOnMonday", true);
    setCalendarPref("defaultView", "week");

    const after = getPrefsSnapshot();
    expect(after).not.toBe(before);
    expect(after.weekStartsOnMonday).toBe(true);
    expect(after.defaultView).toBe("week");
    expect(dispatchEvent).toHaveBeenCalledTimes(2);
    expect(dispatchEvent.mock.calls[0]?.[0]?.type).toBe(PREF_EVENT);
  });
});
