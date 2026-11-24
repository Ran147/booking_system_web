import { describe, expect, it } from "vitest";
import { zonedDayBounds } from "../utils/zonedDayBounds";

describe("zonedDayBounds (AC-KAN-154-02)", () => {
  it("covers a calendar day in the time zone of the business", () => {
    const { end, start } = zonedDayBounds("2026-11-02", "America/Mexico_City");

    expect(start.toISOString()).toBe("2026-11-02T06:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-03T05:59:59.999Z");
  });

  it("reads the same date differently in another time zone", () => {
    const { start } = zonedDayBounds("2026-11-02", "Europe/Madrid");

    expect(start.toISOString()).toBe("2026-11-01T23:00:00.000Z");
  });

  it("follows the daylight saving offset of that day", () => {
    const summer = zonedDayBounds("2026-07-01", "Europe/Madrid");
    const winter = zonedDayBounds("2026-12-01", "Europe/Madrid");

    expect(summer.start.toISOString()).toBe("2026-06-30T22:00:00.000Z");
    expect(winter.start.toISOString()).toBe("2026-11-30T23:00:00.000Z");
  });

  it("makes a 25-hour day on the day clocks go back", () => {
    const { end, start } = zonedDayBounds("2026-10-25", "Europe/Madrid");

    expect(end.getTime() - start.getTime() + 1).toBe(25 * 60 * 60 * 1000);
  });
});
