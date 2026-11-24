import { describe, expect, it } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/test-utils";
import { createAboutPage } from "./AboutPage.page";
import { AboutPage } from "../AboutPage";

describe("AboutPage (US-15 / KAN-15 & US-16 / KAN-16)", () => {
  it("AC-KAN-15-01 & AC-KAN-15-02: renders mission and vision statements in structured cards", () => {
    renderWithProviders(<AboutPage />, {
      initialPath: ROUTE_PATH.LANDING.ABOUT,
      session: SIGNED_OUT_SESSION,
    });

    const page = createAboutPage();

    expect(page.getMissionTitle()).toBeInTheDocument();
    expect(page.getMissionDescription()).toBeInTheDocument();
    expect(page.getVisionTitle()).toBeInTheDocument();
    expect(page.getVisionDescription()).toBeInTheDocument();
  });

  it("AC-KAN-15-03: renders core corporate values cards", () => {
    renderWithProviders(<AboutPage />, {
      initialPath: ROUTE_PATH.LANDING.ABOUT,
      session: SIGNED_OUT_SESSION,
    });

    const page = createAboutPage();

    expect(page.getValuesTitle()).toBeInTheDocument();
    expect(page.getValuesSubtitle()).toBeInTheDocument();

    const values = page.getValues();
    expect(values).toHaveLength(4);
    values.forEach((valueItem) => {
      expect(valueItem).toBeInTheDocument();
    });
  });

  it("AC-KAN-16-01: renders the hero section and company history with milestones", () => {
    renderWithProviders(<AboutPage />, {
      initialPath: ROUTE_PATH.LANDING.ABOUT,
      session: SIGNED_OUT_SESSION,
    });

    const page = createAboutPage();

    expect(page.getPageMain()).toBeInTheDocument();
    expect(page.getHeroBadge()).toBeInTheDocument();
    expect(page.getHeroTitle()).toBeInTheDocument();
    expect(page.getHeroDescription()).toBeInTheDocument();
    expect(page.getHistoryTitle()).toBeInTheDocument();
    expect(page.getHistoryDescription()).toBeInTheDocument();

    const milestones = page.getMilestones();
    expect(milestones).toHaveLength(3);
    milestones.forEach((milestone) => {
      expect(milestone).toBeInTheDocument();
    });
  });

  it("AC-KAN-16-02: renders what we offer section with key solution cards", () => {
    renderWithProviders(<AboutPage />, {
      initialPath: ROUTE_PATH.LANDING.ABOUT,
      session: SIGNED_OUT_SESSION,
    });

    const page = createAboutPage();

    expect(page.getOfferingsTitle()).toBeInTheDocument();
    const offerings = page.getOfferings();
    expect(offerings).toHaveLength(4);
    offerings.forEach((offering) => {
      expect(offering).toBeInTheDocument();
    });
  });

  it("AC-KAN-16-03: renders key platform statistics and metrics cards", () => {
    renderWithProviders(<AboutPage />, {
      initialPath: ROUTE_PATH.LANDING.ABOUT,
      session: SIGNED_OUT_SESSION,
    });

    const page = createAboutPage();

    expect(page.getStatsTitle()).toBeInTheDocument();
    const stats = page.getStats();
    expect(stats).toHaveLength(4);
    stats.forEach((stat) => {
      expect(stat).toBeInTheDocument();
    });
  });
});
