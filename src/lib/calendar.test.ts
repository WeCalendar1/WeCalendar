import { describe, it, expect } from "vitest";
import {
  startOfDay,
  startOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  addYears,
  isSameDay,
  isSameMonth,
  formatHourLabel,
  getMonthGrid,
  getWeekDays,
  getMinutesSinceMidnight,
  shiftViewDate,
  DAY_HOURS,
} from "./calendar";

describe("startOfDay", () => {
  it("zeroes out hours/minutes/seconds", () => {
    const d = startOfDay(new Date(2025, 5, 15, 14, 30, 45));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getDate()).toBe(15);
  });
});

describe("startOfMonth", () => {
  it("returns the 1st of the month", () => {
    const d = startOfMonth(new Date(2025, 5, 20));
    expect(d.getDate()).toBe(1);
    expect(d.getMonth()).toBe(5);
    expect(d.getFullYear()).toBe(2025);
  });
});

describe("startOfWeek", () => {
  it("returns the Sunday of the week", () => {
    // 2025-06-18 is a Wednesday
    const d = startOfWeek(new Date(2025, 5, 18));
    expect(d.getDay()).toBe(0); // Sunday
    expect(d.getDate()).toBe(15);
  });

  it("returns the same day when it's already Sunday", () => {
    const d = startOfWeek(new Date(2025, 5, 15)); // Sunday
    expect(d.getDate()).toBe(15);
  });
});

describe("addDays", () => {
  it("adds positive days", () => {
    const d = addDays(new Date(2025, 0, 1), 5);
    expect(d.getDate()).toBe(6);
  });

  it("subtracts days with negative amount", () => {
    const d = addDays(new Date(2025, 0, 10), -3);
    expect(d.getDate()).toBe(7);
  });

  it("rolls over to the next month", () => {
    const d = addDays(new Date(2025, 0, 30), 5);
    expect(d.getMonth()).toBe(1); // February
    expect(d.getDate()).toBe(4);
  });
});

describe("addMonths", () => {
  it("advances the month", () => {
    const d = addMonths(new Date(2025, 0, 15), 3);
    expect(d.getMonth()).toBe(3); // April
    expect(d.getDate()).toBe(15);
  });

  it("clamps to last day when target month is shorter", () => {
    // Jan 31 + 1 month → Feb 28 (2025 is not leap year)
    const d = addMonths(new Date(2025, 0, 31), 1);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(28);
  });
});

describe("addYears", () => {
  it("increments the year", () => {
    const d = addYears(new Date(2025, 5, 15), 2);
    expect(d.getFullYear()).toBe(2027);
  });
});

describe("isSameDay", () => {
  it("returns true for same date", () => {
    expect(isSameDay(new Date(2025, 5, 15, 8), new Date(2025, 5, 15, 20))).toBe(true);
  });

  it("returns false for different dates", () => {
    expect(isSameDay(new Date(2025, 5, 15), new Date(2025, 5, 16))).toBe(false);
  });
});

describe("isSameMonth", () => {
  it("returns true for same month/year", () => {
    expect(isSameMonth(new Date(2025, 5, 1), new Date(2025, 5, 30))).toBe(true);
  });

  it("returns false for different months", () => {
    expect(isSameMonth(new Date(2025, 5, 1), new Date(2025, 6, 1))).toBe(false);
  });
});

describe("formatHourLabel", () => {
  it("formats midnight", () => {
    expect(formatHourLabel(0)).toBe("12 AM");
  });

  it("formats noon", () => {
    expect(formatHourLabel(12)).toBe("12 PM");
  });

  it("formats AM hours", () => {
    expect(formatHourLabel(9)).toBe("9 AM");
  });

  it("formats PM hours", () => {
    expect(formatHourLabel(15)).toBe("3 PM");
  });
});

describe("DAY_HOURS", () => {
  it("has 24 entries starting from 0", () => {
    expect(DAY_HOURS).toHaveLength(24);
    expect(DAY_HOURS[0]).toBe(0);
    expect(DAY_HOURS[23]).toBe(23);
  });
});

describe("getMonthGrid", () => {
  const JUNE_2025 = new Date(2025, 5, 15);
  const TODAY = new Date(2025, 5, 15);

  it("always returns 42 days (6 weeks)", () => {
    expect(getMonthGrid(JUNE_2025, TODAY)).toHaveLength(42);
  });

  it("first cell is a Sunday", () => {
    const grid = getMonthGrid(JUNE_2025, TODAY);
    expect(grid[0]!.date.getDay()).toBe(0);
  });

  it("marks today correctly", () => {
    const grid = getMonthGrid(JUNE_2025, TODAY);
    const todayCells = grid.filter((d) => d.isToday);
    expect(todayCells).toHaveLength(1);
    expect(todayCells[0]!.date.getDate()).toBe(15);
  });

  it("marks cells outside the month as not inCurrentMonth", () => {
    const grid = getMonthGrid(JUNE_2025, TODAY);
    // June 2025 starts on Sunday so first cell is June 1 — no out-of-month prefix
    // But the last few cells should be July
    const outOfMonth = grid.filter((d) => !d.inCurrentMonth);
    expect(outOfMonth.length).toBeGreaterThan(0);
    outOfMonth.forEach((d) => expect(d.date.getMonth()).not.toBe(5));
  });
});

describe("getWeekDays", () => {
  it("returns 7 days", () => {
    expect(getWeekDays(new Date(2025, 5, 18))).toHaveLength(7);
  });

  it("first day is Sunday", () => {
    const days = getWeekDays(new Date(2025, 5, 18));
    expect(days[0]!.date.getDay()).toBe(0);
  });

  it("last day is Saturday", () => {
    const days = getWeekDays(new Date(2025, 5, 18));
    expect(days[6]!.date.getDay()).toBe(6);
  });
});

describe("getMinutesSinceMidnight", () => {
  it("returns correct minutes for 9:30 AM", () => {
    const d = new Date(2025, 5, 15, 9, 30);
    expect(getMinutesSinceMidnight(d)).toBe(570);
  });

  it("returns 0 at midnight", () => {
    const d = new Date(2025, 5, 15, 0, 0);
    expect(getMinutesSinceMidnight(d)).toBe(0);
  });
});

describe("shiftViewDate", () => {
  const BASE = new Date(2025, 5, 15); // June 15

  it("shifts by 1 day in day mode", () => {
    const next = shiftViewDate(BASE, "day", 1);
    expect(next.getDate()).toBe(16);
  });

  it("shifts by 7 days in week mode", () => {
    const next = shiftViewDate(BASE, "week", 1);
    expect(next.getDate()).toBe(22);
  });

  it("shifts by 1 month in month mode", () => {
    const next = shiftViewDate(BASE, "month", 1);
    expect(next.getMonth()).toBe(6); // July
  });

  it("shifts by 1 year in year mode", () => {
    const next = shiftViewDate(BASE, "year", 1);
    expect(next.getFullYear()).toBe(2026);
  });

  it("shifts backward with -1 direction", () => {
    const prev = shiftViewDate(BASE, "day", -1);
    expect(prev.getDate()).toBe(14);
  });
});
