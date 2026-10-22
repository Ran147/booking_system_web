import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/shared/types";
import { LINK_TARGET } from "../constants";
import type { FooterSocialNetwork } from "../models";

export interface LandingFooterPageObject {
  clickNavigationLink: (label: string) => Promise<void>;
  getAllNavigationLinks: () => HTMLElement[];
  getAllSocialLinks: () => HTMLElement[];
  getBrandDescription: () => HTMLElement;
  getBrandName: () => HTMLElement;
  getCopyright: () => HTMLElement;
  getEmailLink: () => Nullable<HTMLElement>;
  getFooter: () => HTMLElement;
  getLogo: () => HTMLElement;
  getNavigationLink: (label: string) => HTMLElement;
  getPhoneLink: () => Nullable<HTMLElement>;
  getSocialLink: (network: FooterSocialNetwork) => Nullable<HTMLElement>;
  queryContactHeading: () => Nullable<HTMLElement>;
  querySocialHeading: () => Nullable<HTMLElement>;
}

export const createLandingFooterPage = (): LandingFooterPageObject => {
  const user = userEvent.setup();

  const getFooter = (): HTMLElement =>
    screen.getByRole("contentinfo", {
      name: testI18n.t("landing:footer.landmarkLabel"),
    });

  const getLogo = (): HTMLElement =>
    screen.getByRole("img", {
      name: testI18n.t("landing:footer.branding.logoAlt"),
    });

  const getBrandName = (): HTMLElement =>
    within(getFooter()).getByText(testI18n.t("landing:footer.brandName"));

  const getBrandDescription = (): HTMLElement =>
    within(getFooter()).getByText(
      testI18n.t("landing:footer.branding.description"),
    );

  const getNavigationLink = (label: string): HTMLElement =>
    within(getFooter()).getByRole("link", { name: label });

  const getAllNavigationLinks = (): HTMLElement[] => {
    const navElement = within(getFooter()).getByRole("navigation", {
      name: testI18n.t("landing:footer.links.title"),
    });
    return within(navElement).getAllByRole("link");
  };

  const getPhoneLink = (): Nullable<HTMLElement> => {
    const links = within(getFooter()).queryAllByRole("link");
    return (
      links.find((link) => link.getAttribute("href")?.startsWith("tel:")) ??
      null
    );
  };

  const getEmailLink = (): Nullable<HTMLElement> => {
    const links = within(getFooter()).queryAllByRole("link");
    return (
      links.find((link) => link.getAttribute("href")?.startsWith("mailto:")) ??
      null
    );
  };

  const getSocialLink = (
    network: FooterSocialNetwork,
  ): Nullable<HTMLElement> => {
    const accessibleLabel = testI18n.t(`landing:footer.social.${network}`);
    return within(getFooter()).queryByRole("link", { name: accessibleLabel });
  };

  const getAllSocialLinks = (): HTMLElement[] => {
    const links = within(getFooter()).queryAllByRole("link");
    return links.filter((link) => {
      const target = link.getAttribute("target");
      const href = link.getAttribute("href");
      return (
        target === LINK_TARGET.BLANK &&
        href !== null &&
        (href.startsWith("http://") || href.startsWith("https://"))
      );
    });
  };

  const getCopyright = (): HTMLElement => {
    const currentYear = new Date().getFullYear();
    const copyrightText = testI18n.t("landing:footer.copyright", {
      year: currentYear,
    });
    return within(getFooter()).getByText(copyrightText);
  };

  const queryContactHeading = (): Nullable<HTMLElement> =>
    within(getFooter()).queryByRole("heading", {
      name: testI18n.t("landing:footer.contact.title"),
    });

  const querySocialHeading = (): Nullable<HTMLElement> =>
    within(getFooter()).queryByRole("heading", {
      name: testI18n.t("landing:footer.social.title"),
    });

  const clickNavigationLink = async (label: string): Promise<void> => {
    await user.click(getNavigationLink(label));
  };

  return {
    clickNavigationLink,
    getAllNavigationLinks,
    getAllSocialLinks,
    getBrandDescription,
    getBrandName,
    getCopyright,
    getEmailLink,
    getFooter,
    getLogo,
    getNavigationLink,
    getPhoneLink,
    getSocialLink,
    queryContactHeading,
    querySocialHeading,
  };
};
