import { describe, expect, it } from "vitest";
import { resolveServicePrice } from "../utils/resolveServicePrice";

const TIME_ZONE = "America/Costa_Rica";
// 20:00 in Costa Rica on 2026-11-15 is already 2026-11-16 in UTC.
const NOW = new Date("2026-11-16T02:00:00.000Z");

describe("resolveServicePrice (mirror of buildServiceSnapshot)", () => {
  it("keeps the price without discounts", () => {
    expect(resolveServicePrice(25_000, undefined, TIME_ZONE, NOW)).toBe(25_000);
  });

  it("AC-KAN-146-06: applies an active percentage discount", () => {
    const discounts = [
      {
        endsAt: "2026-11-30",
        startsAt: "2026-11-01",
        type: "percentage",
        value: 20,
      },
    ];

    expect(resolveServicePrice(25_000, discounts, TIME_ZONE, NOW)).toBe(20_000);
  });

  it("AC-KAN-146-06: applies an active fixed discount and never goes below zero", () => {
    const discount = (value: number): unknown[] => [
      {
        endsAt: "2026-11-15",
        startsAt: "2026-11-15",
        type: "fixed_amount",
        value,
      },
    ];

    expect(resolveServicePrice(25_000, discount(5_000), TIME_ZONE, NOW)).toBe(
      20_000,
    );
    expect(resolveServicePrice(25_000, discount(90_000), TIME_ZONE, NOW)).toBe(
      0,
    );
  });

  it("counts the days in the business time zone, not in UTC", () => {
    // In UTC it is already the 16th, when this discount has ended.
    const discounts = [
      {
        endsAt: "2026-11-15",
        startsAt: "2026-11-10",
        type: "percentage",
        value: 50,
      },
    ];

    expect(resolveServicePrice(10_000, discounts, TIME_ZONE, NOW)).toBe(5_000);
  });

  it("ignores expired and future discounts, and reads Timestamps", () => {
    const timestamp = (iso: string): { toDate: () => Date } => ({
      toDate: (): Date => new Date(iso),
    });
    const discounts = [
      {
        endsAt: "2026-11-01",
        startsAt: "2026-10-01",
        type: "percentage",
        value: 50,
      },
      {
        endsAt: timestamp("2026-12-31T12:00:00.000Z"),
        startsAt: timestamp("2026-12-01T12:00:00.000Z"),
        type: "percentage",
        value: 50,
      },
    ];

    expect(resolveServicePrice(10_000, discounts, TIME_ZONE, NOW)).toBe(10_000);
  });

  it("caps a percentage at 100", () => {
    const discounts = [
      {
        endsAt: "2026-11-30",
        startsAt: "2026-11-01",
        type: "percentage",
        value: 150,
      },
    ];

    expect(resolveServicePrice(10_000, discounts, TIME_ZONE, NOW)).toBe(0);
  });
});
