import { fireEvent, screen, within } from "@testing-library/react";
import { testI18n } from "@/test-utils";
import type { Nullable } from "@/types";

/** Test actions and accessible queries for CustomerFooter. */
export interface CustomerFooterPageObject {
  failLogoLoad: () => void;
  getEmailLink: () => HTMLElement;
  getFooter: () => HTMLElement;
  getLogo: () => HTMLElement;
  getPhoneLink: () => HTMLElement;
  getSocialLink: (network: string, businessName: string) => HTMLElement;
  getTermsLink: () => HTMLElement;
  queryContactHeading: () => Nullable<HTMLElement>;
  queryEmailLink: () => Nullable<HTMLElement>;
  queryLogo: () => Nullable<HTMLElement>;
  queryPhoneLink: () => Nullable<HTMLElement>;
  querySocialHeading: () => Nullable<HTMLElement>;
}

export const createCustomerFooterPage = (): CustomerFooterPageObject => {
  const getFooter = (): HTMLElement =>
    screen.getByRole("contentinfo", {
      name: testI18n.t("customer:layout.footer.landmarkLabel"),
    });

  const getLogo = (): HTMLElement => within(getFooter()).getByRole("img");

  return {
    failLogoLoad: (): void => {
      fireEvent.error(getLogo());
    },
    getEmailLink: (): HTMLElement =>
      within(getFooter()).getByRole("link", {
        name: testI18n.t("customer:layout.footer.contact.emailLabel", {
          email: "contacto@negocio.test",
        }),
      }),
    getFooter,
    getLogo,
    getPhoneLink: (): HTMLElement =>
      within(getFooter()).getByRole("link", {
        name: testI18n.t("customer:layout.footer.contact.phoneLabel", {
          phone: "+506 2222-3333",
        }),
      }),
    getSocialLink: (network: string, businessName: string): HTMLElement =>
      within(getFooter()).getByRole("link", {
        name: testI18n.t("customer:layout.footer.social.linkLabel", {
          businessName,
          network,
        }),
      }),
    getTermsLink: (): HTMLElement =>
      within(getFooter()).getByRole("link", {
        name: testI18n.t("customer:layout.footer.terms.linkLabel"),
      }),
    queryContactHeading: (): Nullable<HTMLElement> =>
      within(getFooter()).queryByRole("heading", {
        name: testI18n.t("customer:layout.footer.contact.title"),
      }),
    queryEmailLink: (): Nullable<HTMLElement> =>
      within(getFooter()).queryByRole("link", {
        name: testI18n.t("customer:layout.footer.contact.emailLabel", {
          email: "contacto@negocio.test",
        }),
      }),
    queryLogo: (): Nullable<HTMLElement> =>
      within(getFooter()).queryByRole("img"),
    queryPhoneLink: (): Nullable<HTMLElement> =>
      within(getFooter()).queryByRole("link", {
        name: testI18n.t("customer:layout.footer.contact.phoneLabel", {
          phone: "+506 2222-3333",
        }),
      }),
    querySocialHeading: (): Nullable<HTMLElement> =>
      within(getFooter()).queryByRole("heading", {
        name: testI18n.t("customer:layout.footer.social.title"),
      }),
  };
};
