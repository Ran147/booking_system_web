import { describe, expect, it } from "vitest";
import {
  DISCOUNT_STATUS,
  DISCOUNT_TYPE,
} from "../constants/ServiceDiscount.constants";
import {
  calculateDiscountedPrice,
  getDiscountStatus,
  hasDateRangeOverlap,
} from "../utils/discountCalculations";

describe("discountCalculations", () => {
  describe("calculateDiscountedPrice", () => {
    it("calculates percentage discount correctly", () => {
      const discountedPrice = calculateDiscountedPrice(20000, {
        endsAt: new Date(),
        startsAt: new Date(),
        type: DISCOUNT_TYPE.PERCENTAGE,
        value: 20,
      });

      expect(discountedPrice).toBe(16000);
    });

    it("clamps percentage discount so price is never negative", () => {
      const discountedPrice = calculateDiscountedPrice(20000, {
        endsAt: new Date(),
        startsAt: new Date(),
        type: DISCOUNT_TYPE.PERCENTAGE,
        value: 250, // invalid value should be clamped
      });

      expect(discountedPrice).toBe(0);
    });

    it("calculates fixed amount discount correctly", () => {
      const discountedPrice = calculateDiscountedPrice(20000, {
        endsAt: new Date(),
        startsAt: new Date(),
        type: DISCOUNT_TYPE.FIXED_AMOUNT,
        value: 5000,
      });

      expect(discountedPrice).toBe(15000);
    });

    it("clamps fixed amount discount so price is never negative", () => {
      const discountedPrice = calculateDiscountedPrice(20000, {
        endsAt: new Date(),
        startsAt: new Date(),
        type: DISCOUNT_TYPE.FIXED_AMOUNT,
        value: 99999,
      });

      expect(discountedPrice).toBe(0);
    });
  });

  describe("hasDateRangeOverlap", () => {
    const existingDiscounts = [
      {
        endsAt: new Date("2026-11-10T23:59:59.999Z"),
        startsAt: new Date("2026-11-01T00:00:00.000Z"),
        type: DISCOUNT_TYPE.PERCENTAGE,
        value: 10,
      },
    ];

    it("detects overlapping range", () => {
      const overlaps = hasDateRangeOverlap(
        existingDiscounts,
        {
          endsAt: new Date("2026-11-15T23:59:59.999Z"),
          startsAt: new Date("2026-11-05T00:00:00.000Z"),
        },
        undefined,
        "UTC",
      );

      expect(overlaps).toBe(true);
    });

    it("returns false for non-overlapping range", () => {
      const overlaps = hasDateRangeOverlap(
        existingDiscounts,
        {
          endsAt: new Date("2026-11-20T23:59:59.999Z"),
          startsAt: new Date("2026-11-15T00:00:00.000Z"),
        },
        undefined,
        "UTC",
      );

      expect(overlaps).toBe(false);
    });
  });

  describe("getDiscountStatus", () => {
    it("returns active when currentDate is within the validity range in timezone", () => {
      const discount = {
        endsAt: new Date("2026-10-20"),
        startsAt: new Date("2026-10-15"),
        type: DISCOUNT_TYPE.PERCENTAGE,
        value: 15,
      };

      const status = getDiscountStatus(
        discount,
        new Date("2026-10-18T12:00:00Z"),
        "UTC",
      );

      expect(status).toBe(DISCOUNT_STATUS.ACTIVE);
    });

    it("returns expired when currentDate is past the full end day in timezone", () => {
      const discount = {
        endsAt: new Date("2026-10-20"),
        startsAt: new Date("2026-10-15"),
        type: DISCOUNT_TYPE.PERCENTAGE,
        value: 15,
      };

      const status = getDiscountStatus(
        discount,
        new Date("2026-10-21T12:00:00Z"),
        "UTC",
      );

      expect(status).toBe(DISCOUNT_STATUS.EXPIRED);
    });

    it("returns upcoming when currentDate is before the start day in timezone", () => {
      const discount = {
        endsAt: new Date("2026-10-20"),
        startsAt: new Date("2026-10-15"),
        type: DISCOUNT_TYPE.PERCENTAGE,
        value: 15,
      };

      const status = getDiscountStatus(
        discount,
        new Date("2026-10-10T12:00:00Z"),
        "UTC",
      );

      expect(status).toBe(DISCOUNT_STATUS.UPCOMING);
    });
  });
});
