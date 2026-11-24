import { describe, expect, it } from "vitest";
import {
  buildWeekDays,
  listOpenDays,
  readLastBookableDay,
} from "../utils/buildWeekDays";
import { addCalendarDays, formatZonedDate } from "../utils/calendarDate";

const OPEN = [{ closesAt: "18:00", opensAt: "09:00" }];
// 2026-11-16 is a Monday.
const MONDAY = "2026-11-16";
const WEEKDAYS_ONLY = {
  friday: OPEN,
  monday: OPEN,
  saturday: [],
  sunday: null,
  thursday: OPEN,
  tuesday: OPEN,
  wednesday: OPEN,
};

describe("buildWeekDays", () => {
  it("AC-KAN-143-03: disables the weekdays without business hours", () => {
    const days = buildWeekDays({
      businessHours: WEEKDAYS_ONLY,
      firstDay: MONDAY,
      today: MONDAY,
    });

    expect(days.map((day) => day.isDisabled)).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
      true,
    ]);
    expect(days[0]?.isToday).toBe(true);
  });

  it("AC-KAN-140-04: disables the days before today", () => {
    const days = buildWeekDays({
      businessHours: WEEKDAYS_ONLY,
      firstDay: MONDAY,
      today: addCalendarDays(MONDAY, 2),
    });

    expect(days.slice(0, 3).map((day) => day.isDisabled)).toEqual([
      true,
      true,
      false,
    ]);
  });

  it("AC-KAN-140-05: disables the days after the 60-day window", () => {
    const lastDay = readLastBookableDay(MONDAY);
    const days = buildWeekDays({
      businessHours: { ...WEEKDAYS_ONLY, saturday: OPEN, sunday: OPEN },
      firstDay: addCalendarDays(lastDay, -1),
      today: MONDAY,
    });

    expect(lastDay).toBe("2027-01-15");
    expect(days.map((day) => day.isDisabled)).toEqual([
      false,
      false,
      true,
      true,
      true,
      true,
      true,
    ]);
  });

  it("AC-KAN-140-06: today is the calendar day of the business, not of the device", () => {
    // 03:00 UTC on 2026-11-17 is still 2026-11-16 in Costa Rica (UTC-6).
    const instant = new Date("2026-11-17T03:00:00.000Z");

    expect(formatZonedDate(instant, "America/Costa_Rica")).toBe(MONDAY);
    expect(formatZonedDate(instant, "Europe/Madrid")).toBe("2026-11-17");
  });
});

describe("listOpenDays", () => {
  it("AS-2: lists only the open days of the window, in order", () => {
    const days = listOpenDays(WEEKDAYS_ONLY, MONDAY);

    expect(days.slice(0, 6)).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-23",
    ]);
    expect(days.at(-1)).toBe("2027-01-15");
  });
});
