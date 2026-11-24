import { describe, expect, it } from "vitest";
import { parseZonedDateTime } from "../parseZonedDateTime";

describe("parseZonedDateTime", () => {
  it("interprets date and time in Costa Rica timezone (UTC-6)", () => {
    const result = parseZonedDateTime(
      "2026-11-08",
      "14:30",
      "America/Costa_Rica",
    );

    // 14:30 Costa Rica is 20:30 UTC
    expect(result.toISOString()).toBe("2026-11-08T20:30:00.000Z");
  });

  it("handles morning hour in Costa Rica timezone", () => {
    const result = parseZonedDateTime(
      "2026-11-08",
      "08:00",
      "America/Costa_Rica",
    );

    // 08:00 Costa Rica is 14:00 UTC
    expect(result.toISOString()).toBe("2026-11-08T14:00:00.000Z");
  });
});
