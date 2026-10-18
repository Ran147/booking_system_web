import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/shared/test-utils";
import { createHeroSectionPage } from "./HeroSection.page";
import { HeroSection } from "../components/HeroSection";
import { HERO_SECTION_CONSTANTS } from "../constants/HeroSection.constants";

describe("HeroSection (KAN-2)", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-KAN-2-01: renders the hero section with badge, headline, tagline, and call to action", () => {
    renderWithProviders(<HeroSection />, {
      initialPath: "/",
      session: SIGNED_OUT_SESSION,
    });

    const page = createHeroSectionPage();

    expect(page.getBadge()).toBeInTheDocument();
    expect(page.getHeading()).toBeInTheDocument();
    expect(page.getTagline()).toBeInTheDocument();
    expect(page.getCtaButton()).toBeInTheDocument();
  });

  it("AC-KAN-2-02: scrolls smoothly to plans section and focuses heading when CTA is clicked", async () => {
    const plansSectionElement = document.createElement("section");
    plansSectionElement.id = HERO_SECTION_CONSTANTS.TARGET_SECTION_ID;

    const plansHeadingElement = document.createElement("h2");
    plansHeadingElement.id = HERO_SECTION_CONSTANTS.TARGET_HEADING_ID;
    plansSectionElement.appendChild(plansHeadingElement);

    document.body.appendChild(plansSectionElement);

    const scrollIntoViewSpy = vi.spyOn(plansSectionElement, "scrollIntoView");
    const focusSpy = vi.spyOn(plansHeadingElement, "focus");

    renderWithProviders(<HeroSection />, {
      initialPath: "/",
      session: SIGNED_OUT_SESSION,
    });

    const page = createHeroSectionPage();
    await page.clickCtaButton();

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: HERO_SECTION_CONSTANTS.SCROLL_BEHAVIOR,
    });
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

    document.body.removeChild(plansSectionElement);
  });

  it("AC-KAN-2-03: falls back to URL hash safely when target section is absent from DOM", async () => {
    renderWithProviders(<HeroSection />, {
      initialPath: "/",
      session: SIGNED_OUT_SESSION,
    });

    const page = createHeroSectionPage();
    await page.clickCtaButton();

    expect(window.location.hash).toBe(
      `#${HERO_SECTION_CONSTANTS.TARGET_SECTION_ID}`,
    );
  });
});
