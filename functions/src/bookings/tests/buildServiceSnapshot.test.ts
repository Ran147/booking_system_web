import { describe, expect, it } from "vitest";
import { DISCOUNT_TYPE } from "../../shared/constants/ServiceDiscount.constants.js";
import { buildServiceSnapshot } from "../utils/buildServiceSnapshot.js";

describe("buildServiceSnapshot", () => {
  const baseServiceData = {
    durationMinutes: 45,
    name: "Corte Clásico",
    priceInCents: 20000,
  };

  it("calculates snapshot with regular price when there are no discounts", () => {
    const snapshot = buildServiceSnapshot({
      serviceData: baseServiceData,
    });

    expect(snapshot).toEqual({
      durationMinutes: 45,
      name: "Corte Clásico",
      priceInCents: 20000,
    });
  });

  it("applies active percentage discount", () => {
    const now = new Date("2026-10-18T12:00:00Z");
    const snapshot = buildServiceSnapshot({
      currentDate: now,
      serviceData: {
        ...baseServiceData,
        discounts: [
          {
            endsAt: "2026-10-20T23:59:59Z",
            startsAt: "2026-10-10T00:00:00Z",
            type: DISCOUNT_TYPE.PERCENTAGE,
            value: 20, // 20% off 20000 = 16000
          },
        ],
      },
      timeZone: "UTC",
    });

    expect(snapshot.priceInCents).toBe(16000);
  });

  it("applies active fixed-amount discount", () => {
    const now = new Date("2026-10-18T12:00:00Z");
    const snapshot = buildServiceSnapshot({
      currentDate: now,
      serviceData: {
        ...baseServiceData,
        discounts: [
          {
            endsAt: "2026-10-20T23:59:59Z",
            startsAt: "2026-10-10T00:00:00Z",
            type: DISCOUNT_TYPE.FIXED_AMOUNT,
            value: 5000, // 5000 off 20000 = 15000
          },
        ],
      },
      timeZone: "UTC",
    });

    expect(snapshot.priceInCents).toBe(15000);
  });

  it("clamps price to 0 when discount percentage is greater than 100", () => {
    const now = new Date("2026-10-18T12:00:00Z");
    const snapshot = buildServiceSnapshot({
      currentDate: now,
      serviceData: {
        ...baseServiceData,
        discounts: [
          {
            endsAt: "2026-10-20T23:59:59Z",
            startsAt: "2026-10-10T00:00:00Z",
            type: DISCOUNT_TYPE.PERCENTAGE,
            value: 250, // invalid percentage should clamp and not result in negative price
          },
        ],
      },
      timeZone: "UTC",
    });

    expect(snapshot.priceInCents).toBe(0);
  });

  it("clamps price to 0 when fixed amount discount exceeds service price", () => {
    const now = new Date("2026-10-18T12:00:00Z");
    const snapshot = buildServiceSnapshot({
      currentDate: now,
      serviceData: {
        ...baseServiceData,
        discounts: [
          {
            endsAt: "2026-10-20T23:59:59Z",
            startsAt: "2026-10-10T00:00:00Z",
            type: DISCOUNT_TYPE.FIXED_AMOUNT,
            value: 999999,
          },
        ],
      },
      timeZone: "UTC",
    });

    expect(snapshot.priceInCents).toBe(0);
  });

  it("evaluates discount validity according to the business timeZone", () => {
    // 2026-10-21 at 02:00:00 UTC is still 2026-10-20 at 20:00:00 in America/Costa_Rica (UTC-6)
    const lateNightInCostaRica = new Date("2026-10-21T02:00:00Z");

    const snapshot = buildServiceSnapshot({
      currentDate: lateNightInCostaRica,
      serviceData: {
        ...baseServiceData,
        discounts: [
          {
            endsAt: "2026-10-20",
            startsAt: "2026-10-15",
            type: DISCOUNT_TYPE.PERCENTAGE,
            value: 10,
          },
        ],
      },
      timeZone: "America/Costa_Rica",
    });

    // In Costa Rica it is still Oct 20th, so the discount is valid for the full end day!
    expect(snapshot.priceInCents).toBe(18000);
  });

  it("ignores expired discounts", () => {
    const now = new Date("2026-10-25T12:00:00Z");
    const snapshot = buildServiceSnapshot({
      currentDate: now,
      serviceData: {
        ...baseServiceData,
        discounts: [
          {
            endsAt: "2026-10-20T23:59:59Z",
            startsAt: "2026-10-10T00:00:00Z",
            type: DISCOUNT_TYPE.PERCENTAGE,
            value: 50,
          },
        ],
      },
      timeZone: "UTC",
    });

    expect(snapshot.priceInCents).toBe(20000);
  });

  it("ignores upcoming discounts", () => {
    const now = new Date("2026-10-05T12:00:00Z");
    const snapshot = buildServiceSnapshot({
      currentDate: now,
      serviceData: {
        ...baseServiceData,
        discounts: [
          {
            endsAt: "2026-10-20T23:59:59Z",
            startsAt: "2026-10-10T00:00:00Z",
            type: DISCOUNT_TYPE.PERCENTAGE,
            value: 50,
          },
        ],
      },
      timeZone: "UTC",
    });

    expect(snapshot.priceInCents).toBe(20000);
  });
});
