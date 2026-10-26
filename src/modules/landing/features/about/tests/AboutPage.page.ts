import { screen } from "@testing-library/react";
import { testI18n } from "@/test-utils/testI18n";

export interface AboutPageObject {
  getHeroBadge: () => HTMLElement;
  getHeroDescription: () => HTMLElement;
  getHeroTitle: () => HTMLElement;
  getHistoryDescription: () => HTMLElement;
  getHistoryTitle: () => HTMLElement;
  getMilestones: () => HTMLElement[];
  getOfferings: () => HTMLElement[];
  getOfferingsTitle: () => HTMLElement;
  getPageMain: () => HTMLElement;
  getStats: () => HTMLElement[];
  getStatsTitle: () => HTMLElement;
}

export const createAboutPage = (): AboutPageObject => {
  const getPageMain = (): HTMLElement =>
    screen.getByRole("main", {
      name: testI18n.t("landing:about.page.ariaLabel"),
    });

  const getHeroTitle = (): HTMLElement =>
    screen.getByRole("heading", {
      level: 1,
      name: testI18n.t("landing:about.hero.title"),
    });

  const getHeroBadge = (): HTMLElement =>
    screen.getByText(testI18n.t("landing:about.hero.badge"));

  const getHeroDescription = (): HTMLElement =>
    screen.getByText(testI18n.t("landing:about.hero.description"));

  const getHistoryTitle = (): HTMLElement =>
    screen.getByRole("heading", {
      level: 2,
      name: testI18n.t("landing:about.history.title"),
    });

  const getHistoryDescription = (): HTMLElement =>
    screen.getByText(testI18n.t("landing:about.history.description"));

  const getMilestones = (): HTMLElement[] => [
    screen.getByText(testI18n.t("landing:about.history.milestones.m1.title")),
    screen.getByText(testI18n.t("landing:about.history.milestones.m2.title")),
    screen.getByText(testI18n.t("landing:about.history.milestones.m3.title")),
  ];

  const getOfferingsTitle = (): HTMLElement =>
    screen.getByRole("heading", {
      level: 2,
      name: testI18n.t("landing:about.offerings.title"),
    });

  const getOfferings = (): HTMLElement[] => [
    screen.getByText(testI18n.t("landing:about.offerings.items.booking.title")),
    screen.getByText(
      testI18n.t("landing:about.offerings.items.reminders.title"),
    ),
    screen.getByText(
      testI18n.t("landing:about.offerings.items.collaboration.title"),
    ),
    screen.getByText(
      testI18n.t("landing:about.offerings.items.analytics.title"),
    ),
  ];

  const getStatsTitle = (): HTMLElement =>
    screen.getByRole("heading", {
      level: 2,
      name: testI18n.t("landing:about.stats.title"),
    });

  const getStats = (): HTMLElement[] => [
    screen.getByText(testI18n.t("landing:about.stats.bookings.value")),
    screen.getByText(testI18n.t("landing:about.stats.businesses.value")),
    screen.getByText(testI18n.t("landing:about.stats.uptime.value")),
    screen.getByText(testI18n.t("landing:about.stats.support.value")),
  ];

  return {
    getHeroBadge,
    getHeroDescription,
    getHeroTitle,
    getHistoryDescription,
    getHistoryTitle,
    getMilestones,
    getOfferings,
    getOfferingsTitle,
    getPageMain,
    getStats,
    getStatsTitle,
  };
};
