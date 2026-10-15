import { screen } from "@testing-library/react";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/types";

export interface BusinessHomePageObject {
  readonly findActiveServicesMetric: () => Promise<HTMLElement>;
  readonly findBusinessStatusMetric: () => Promise<HTMLElement>;
  readonly findPageTitle: () => Promise<HTMLElement>;
  readonly findReadOnlyAlert: () => Promise<HTMLElement>;
  readonly findTodayBookingsMetric: () => Promise<HTMLElement>;
  readonly queryReadOnlyAlert: () => Nullable<HTMLElement>;
}

export const createBusinessHomePage = (): BusinessHomePageObject => {
  const findPageTitle = (): Promise<HTMLElement> =>
    screen.findByRole("heading", {
      level: 1,
      name: testI18n.t("business:home.title"),
    });

  const findActiveServicesMetric = (): Promise<HTMLElement> =>
    screen.findByText(testI18n.t("business:home.metrics.activeServices.label"));

  const findBusinessStatusMetric = (): Promise<HTMLElement> =>
    screen.findByText(testI18n.t("business:home.metrics.businessStatus.label"));

  const findTodayBookingsMetric = (): Promise<HTMLElement> =>
    screen.findByText(testI18n.t("business:home.metrics.todayBookings.label"));

  const findReadOnlyAlert = (): Promise<HTMLElement> =>
    screen.findByRole("alert");

  const queryReadOnlyAlert = (): Nullable<HTMLElement> =>
    screen.queryByRole("alert");

  return {
    findActiveServicesMetric,
    findBusinessStatusMetric,
    findPageTitle,
    findReadOnlyAlert,
    findTodayBookingsMetric,
    queryReadOnlyAlert,
  };
};
