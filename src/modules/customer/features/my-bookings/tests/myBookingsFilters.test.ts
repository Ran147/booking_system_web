import { describe, expect, it } from "vitest";
import { BOOKING_STATUS } from "@/domain";
import { MY_BOOKINGS_TAB } from "../constants";
import {
  buildMyBookingsSearchParams,
  EMPTY_FILTERS,
  hasActiveFilters,
  isRangeInvalid,
  readMyBookingsFilters,
} from "../utils/myBookingsFilters";

describe("my bookings filters in the URL (AC-KAN-154-04)", () => {
  it("reads status, business and date range of the history", () => {
    const filters = readMyBookingsFilters(
      new URLSearchParams(
        "tab=history&status=cancelled&business=business-a&from=2026-10-01&to=2026-10-31",
      ),
      MY_BOOKINGS_TAB.HISTORY,
    );

    expect(filters).toEqual({
      businessId: "business-a",
      from: "2026-10-01",
      status: BOOKING_STATUS.CANCELLED,
      to: "2026-10-31",
    });
  });

  it("ignores values that are not valid for the list", () => {
    const filters = readMyBookingsFilters(
      new URLSearchParams(
        "status=cancelled&from=2026-10-01&to=not-a-date&business=",
      ),
      MY_BOOKINGS_TAB.UPCOMING,
    );

    expect(filters).toEqual(EMPTY_FILTERS);
  });

  it("ignores impossible calendar dates", () => {
    const filters = readMyBookingsFilters(
      new URLSearchParams("from=2026-13-45"),
      MY_BOOKINGS_TAB.HISTORY,
    );

    expect(filters.from).toBeNull();
  });

  it("writes only the filters that are set, after the tab", () => {
    const searchParams = buildMyBookingsSearchParams(MY_BOOKINGS_TAB.HISTORY, {
      ...EMPTY_FILTERS,
      status: BOOKING_STATUS.COMPLETED,
    });

    expect(searchParams.toString()).toBe("tab=history&status=completed");
  });

  it("tells whether any filter is active", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, businessId: "a" })).toBe(true);
  });

  it("AC-KAN-154-06: an end before the start is an invalid range", () => {
    expect(
      isRangeInvalid({
        ...EMPTY_FILTERS,
        from: "2026-10-10",
        to: "2026-10-01",
      }),
    ).toBe(true);
    expect(
      isRangeInvalid({
        ...EMPTY_FILTERS,
        from: "2026-10-01",
        to: "2026-10-01",
      }),
    ).toBe(false);
    expect(isRangeInvalid({ ...EMPTY_FILTERS, from: "2026-10-10" })).toBe(
      false,
    );
  });
});
