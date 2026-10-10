import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/shared/types";
import { LANDING_NAVBAR_CONSTANTS } from "../constants/landingNavbar.constants";

export interface LandingNavbarPageObject {
  clickMobileMenuToggle: () => Promise<void>;
  clickNavigationLink: (label: string) => Promise<void>;
  clickPortalActionButton: () => Promise<void>;
  clickSignInButton: () => Promise<void>;
  getAllNavigationLinks: () => HTMLElement[];
  getBrandName: () => HTMLElement;
  getLogo: () => HTMLElement;
  getMobileMenu: () => Nullable<HTMLElement>;
  getMobileMenuToggleButton: () => HTMLElement;
  getNavbar: () => HTMLElement;
  getNavigationLink: (label: string) => HTMLElement;
  getPortalActionButton: () => HTMLElement;
  getSignInButton: () => HTMLElement;
  queryMobileMenu: () => Nullable<HTMLElement>;
  queryPortalActionButton: () => Nullable<HTMLElement>;
  querySignInButton: () => Nullable<HTMLElement>;
}

export const createLandingNavbarPage = (): LandingNavbarPageObject => {
  const user = userEvent.setup();

  const getNavbar = (): HTMLElement =>
    screen.getByRole("banner", {
      name: testI18n.t(
        `landing:${LANDING_NAVBAR_CONSTANTS.NAVBAR_LANDMARK_LABEL_KEY}`,
      ),
    });

  const getLogo = (): HTMLElement =>
    within(getNavbar()).getByRole("img", {
      name: testI18n.t("landing:home.navbar.logoAlt"),
    });

  const getBrandName = (): HTMLElement =>
    within(getNavbar()).getByText(LANDING_NAVBAR_CONSTANTS.BRAND_NAME);

  const getNavigationLink = (label: string): HTMLElement =>
    within(getNavbar()).getByRole("link", { name: label });

  const getAllNavigationLinks = (): HTMLElement[] => {
    const navElement = within(getNavbar()).getByRole("navigation", {
      name: testI18n.t("landing:home.navbar.linksNavLabel"),
    });
    return within(navElement).getAllByRole("link");
  };

  const getSignInButton = (): HTMLElement =>
    within(getNavbar()).getByRole("button", {
      name: testI18n.t("landing:home.navbar.signIn"),
    });

  const querySignInButton = (): Nullable<HTMLElement> =>
    within(getNavbar()).queryByRole("button", {
      name: testI18n.t("landing:home.navbar.signIn"),
    });

  const getPortalActionButton = (): HTMLElement =>
    within(getNavbar()).getByRole("button", {
      name: testI18n.t("landing:home.navbar.goToPortal"),
    });

  const queryPortalActionButton = (): Nullable<HTMLElement> =>
    within(getNavbar()).queryByRole("button", {
      name: testI18n.t("landing:home.navbar.goToPortal"),
    });

  const getMobileMenuToggleButton = (): HTMLElement => {
    const openButton = within(getNavbar()).queryByRole("button", {
      name: testI18n.t("landing:home.navbar.menuOpen"),
    });
    if (openButton) {
      return openButton;
    }
    return within(getNavbar()).getByRole("button", {
      name: testI18n.t("landing:home.navbar.menuClose"),
    });
  };

  const queryMobileMenu = (): Nullable<HTMLElement> =>
    document.getElementById(LANDING_NAVBAR_CONSTANTS.MOBILE_MENU_ID);

  const getMobileMenu = (): Nullable<HTMLElement> => queryMobileMenu();

  const clickSignInButton = async (): Promise<void> => {
    await user.click(getSignInButton());
  };

  const clickPortalActionButton = async (): Promise<void> => {
    await user.click(getPortalActionButton());
  };

  const clickMobileMenuToggle = async (): Promise<void> => {
    await user.click(getMobileMenuToggleButton());
  };

  const clickNavigationLink = async (label: string): Promise<void> => {
    await user.click(getNavigationLink(label));
  };

  return {
    clickMobileMenuToggle,
    clickNavigationLink,
    clickPortalActionButton,
    clickSignInButton,
    getAllNavigationLinks,
    getBrandName,
    getLogo,
    getMobileMenu,
    getMobileMenuToggleButton,
    getNavbar,
    getNavigationLink,
    getPortalActionButton,
    getSignInButton,
    queryMobileMenu,
    queryPortalActionButton,
    querySignInButton,
  };
};
