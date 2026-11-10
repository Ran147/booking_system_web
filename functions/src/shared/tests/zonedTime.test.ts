import { describe, expect, it } from "vitest";
import { resolveZonedInstant } from "../zonedTime.js";

describe("resolveZonedInstant", () => {
  it("converts a wall-clock time in a zone without daylight saving", () => {
    const instant = resolveZonedInstant(
      "2026-11-10",
      "09:00",
      "America/Costa_Rica",
    );

    expect(instant?.toISOString()).toBe("2026-11-10T15:00:00.000Z");
  });

  it("uses the winter and the summer offset of a zone with daylight saving", () => {
    const winterInstant = resolveZonedInstant(
      "2026-01-15",
      "09:00",
      "America/New_York",
    );
    const summerInstant = resolveZonedInstant(
      "2026-07-15",
      "09:00",
      "America/New_York",
    );

    expect(winterInstant?.toISOString()).toBe("2026-01-15T14:00:00.000Z");
    expect(summerInstant?.toISOString()).toBe("2026-07-15T13:00:00.000Z");
  });

  it("returns null for a wall-clock time that does not exist (clocks jump forward)", () => {
    expect(
      resolveZonedInstant("2026-03-08", "02:30", "America/New_York"),
    ).toBeNull();
  });

  it("keeps the times just outside the skipped hour", () => {
    expect(
      resolveZonedInstant(
        "2026-03-08",
        "01:30",
        "America/New_York",
      )?.toISOString(),
    ).toBe("2026-03-08T06:30:00.000Z");
    expect(
      resolveZonedInstant(
        "2026-03-08",
        "03:00",
        "America/New_York",
      )?.toISOString(),
    ).toBe("2026-03-08T07:00:00.000Z");
  });

  it("returns the first instant of a wall-clock time that happens twice (clocks go back)", () => {
    const instant = resolveZonedInstant(
      "2026-11-01",
      "01:30",
      "America/New_York",
    );

    expect(instant?.toISOString()).toBe("2026-11-01T05:30:00.000Z");
  });
});
