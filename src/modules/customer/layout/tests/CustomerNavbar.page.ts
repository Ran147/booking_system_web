import { fireEvent, screen } from "@testing-library/react";
import { testI18n } from "@/test-utils";
import type { Nullable } from "@/types";

export interface CustomerNavbarPageObject {
  failLogoLoad: (businessName: string) => void;
  getBusinessHomeLink: (businessName: string) => HTMLElement;
  getLogo: (businessName: string) => HTMLElement;
  getNavigation: () => HTMLElement;
  queryBusinessHomeLink: (businessName: string) => Nullable<HTMLElement>;
  queryLogo: (businessName: string) => Nullable<HTMLElement>;
}

export const createCustomerNavbarPage = (): CustomerNavbarPageObject => ({
  failLogoLoad: (businessName: string): void => {
    fireEvent.error(screen.getByRole("img", { name: businessName }));
  },
  getBusinessHomeLink: (businessName: string): HTMLElement =>
    screen.getByRole("link", {
      name: testI18n.t("customer:layout.navbar.businessHomeLabel", {
        businessName,
      }),
    }),
  getLogo: (businessName: string): HTMLElement =>
    screen.getByRole("img", { name: businessName }),
  getNavigation: (): HTMLElement =>
    screen.getByRole("navigation", {
      name: testI18n.t("customer:layout.navbar.landmarkLabel"),
    }),
  queryBusinessHomeLink: (businessName: string): Nullable<HTMLElement> =>
    screen.queryByRole("link", {
      name: testI18n.t("customer:layout.navbar.businessHomeLabel", {
        businessName,
      }),
    }),
  queryLogo: (businessName: string): Nullable<HTMLElement> =>
    screen.queryByRole("img", { name: businessName }),
});
