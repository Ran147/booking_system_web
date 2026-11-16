import { renderHook } from "@testing-library/react";
import {
  createElement,
  type ChangeEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { BOOKING_STATUS } from "@/domain";
import { testI18n } from "@/shared/test-utils/testI18n";
import { SCHEDULE_CONSTANTS } from "../constants";
import { useBookingHistoryFiltersViewModel } from "../hooks";

const wrapper = ({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement =>
  createElement(I18nextProvider, { i18n: testI18n }, children);

describe("useBookingHistoryFiltersViewModel (KAN-76)", () => {
  it("AC-KAN-76-02: provides status options and delegates date and status filter updates", (): void => {
    const handleFilterChange = vi.fn();

    const { result } = renderHook(
      () =>
        useBookingHistoryFiltersViewModel({
          filters: { status: SCHEDULE_CONSTANTS.ALL_FILTER_VALUE },
          onFilterChange: handleFilterChange,
        }),
      { wrapper },
    );

    expect(result.current.statusOptions).toHaveLength(6);
    expect(result.current.statusValue).toBe(
      SCHEDULE_CONSTANTS.ALL_FILTER_VALUE,
    );

    result.current.handleDateChange({
      target: { value: "2026-11-10" },
    } as ChangeEvent<HTMLInputElement>);
    expect(handleFilterChange).toHaveBeenCalledWith("date", "2026-11-10");

    result.current.handleStatusChange({
      target: { value: BOOKING_STATUS.CANCELLED },
    } as ChangeEvent<HTMLSelectElement>);
    expect(handleFilterChange).toHaveBeenCalledWith(
      "status",
      BOOKING_STATUS.CANCELLED,
    );
  });
});
