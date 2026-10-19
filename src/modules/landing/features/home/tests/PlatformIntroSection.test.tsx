import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createPlatformIntroSectionPage } from "./PlatformIntroSection.page";
import { PlatformIntroSection } from "../components/PlatformIntroSection";
import { PLATFORM_INTRO_CONSTANTS } from "../constants/PlatformIntro.constants";

const TEST_PROVIDER_OPTIONS = {
  initialPath: ROUTE_PATH.LANDING.HOME,
  session: SIGNED_OUT_SESSION,
};

describe("PlatformIntroSection (KAN-4)", () => {
  it("AC-KAN-4-01: renders the intro section with badge, heading, summary and read more button", () => {
    renderWithProviders(<PlatformIntroSection />, TEST_PROVIDER_OPTIONS);
    const page = createPlatformIntroSectionPage();

    expect(page.getSection()).toBeInTheDocument();
    expect(page.getBadge()).toBeInTheDocument();
    expect(page.getHeading()).toHaveTextContent(
      testI18n.t(`landing:${PLATFORM_INTRO_CONSTANTS.TITLE_KEY}`),
    );
    expect(page.getSummary()).toBeInTheDocument();

    const toggleButton = page.getToggleButton();
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveTextContent(
      testI18n.t(`landing:${PLATFORM_INTRO_CONSTANTS.READ_MORE_KEY}`),
    );
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(toggleButton).toHaveAttribute(
      "aria-controls",
      PLATFORM_INTRO_CONSTANTS.FULL_TEXT_CONTAINER_ID,
    );
    expect(page.getFullTextContainer()).toBeInTheDocument();
    expect(page.getFullTextContainer()).toBeEmptyDOMElement();
    expect(page.getFullTextParagraph()).not.toBeInTheDocument();
  });

  it("AC-KAN-4-02: expands full introduction text and toggles button label to read less upon activation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlatformIntroSection />, TEST_PROVIDER_OPTIONS);
    const page = createPlatformIntroSectionPage();

    const toggleButton = page.getToggleButton();
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton as HTMLElement);

    const fullTextContainer = page.getFullTextContainer();
    expect(fullTextContainer).toBeInTheDocument();
    expect(fullTextContainer).toHaveTextContent(
      testI18n.t(`landing:${PLATFORM_INTRO_CONSTANTS.FULL_TEXT_KEY}`),
    );
    expect(page.getFullTextParagraph()).toBeInTheDocument();
    expect(page.getToggleButton()).toHaveTextContent(
      testI18n.t(`landing:${PLATFORM_INTRO_CONSTANTS.READ_LESS_KEY}`),
    );
    expect(page.getToggleButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("AC-KAN-4-03: collapses full introduction text when read less is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlatformIntroSection />, TEST_PROVIDER_OPTIONS);
    const page = createPlatformIntroSectionPage();

    const toggleButton = page.getToggleButton();
    await user.click(toggleButton as HTMLElement);
    expect(page.getFullTextContainer()).not.toBeEmptyDOMElement();
    expect(page.getFullTextParagraph()).toBeInTheDocument();

    await user.click(page.getToggleButton() as HTMLElement);
    expect(page.getFullTextContainer()).toBeEmptyDOMElement();
    expect(page.getFullTextParagraph()).not.toBeInTheDocument();
    expect(page.getToggleButton()).toHaveTextContent(
      testI18n.t(`landing:${PLATFORM_INTRO_CONSTANTS.READ_MORE_KEY}`),
    );
    expect(page.getToggleButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("AC-KAN-4-04: ensures the aria-live polite region remains mounted in the DOM across toggle states", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlatformIntroSection />, TEST_PROVIDER_OPTIONS);
    const page = createPlatformIntroSectionPage();

    const liveRegion = page.getFullTextContainer();
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    expect(liveRegion).toBeEmptyDOMElement();

    const toggleButton = page.getToggleButton();
    await user.click(toggleButton as HTMLElement);

    expect(liveRegion).not.toBeEmptyDOMElement();
    expect(page.getFullTextParagraph()).toBeInTheDocument();

    await user.click(toggleButton as HTMLElement);

    expect(liveRegion).toBeEmptyDOMElement();
    expect(page.getFullTextParagraph()).not.toBeInTheDocument();
  });

  it("AC-KAN-4-05: adheres to accessible landmark labels and renders key features", () => {
    renderWithProviders(<PlatformIntroSection />, TEST_PROVIDER_OPTIONS);
    const page = createPlatformIntroSectionPage();

    const section = page.getSection();
    expect(section).toHaveAttribute(
      "aria-labelledby",
      PLATFORM_INTRO_CONSTANTS.HEADING_ID,
    );
    expect(page.getFeatures().length).toBeGreaterThanOrEqual(1);
  });
});
