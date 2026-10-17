import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createPlatformIntroSectionPage } from "./PlatformIntroSection.page";
import { PlatformIntroSection } from "../components/PlatformIntroSection";
import { PLATFORM_INTRO_CONSTANTS } from "../constants/PlatformIntro.constants";
import * as usePlatformIntroViewModelModule from "../hooks/usePlatformIntroViewModel";

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
    expect(page.getFullTextContainer()).not.toBeInTheDocument();
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
    expect(page.getFullTextContainer()).toBeInTheDocument();

    await user.click(page.getToggleButton() as HTMLElement);
    expect(page.getFullTextContainer()).not.toBeInTheDocument();
    expect(page.getToggleButton()).toHaveTextContent(
      testI18n.t(`landing:${PLATFORM_INTRO_CONSTANTS.READ_MORE_KEY}`),
    );
    expect(page.getToggleButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("AC-KAN-4-04: does not render toggle button when full text is missing or unavailable", () => {
    const originalHook =
      usePlatformIntroViewModelModule.usePlatformIntroViewModel;
    vi.spyOn(
      usePlatformIntroViewModelModule,
      "usePlatformIntroViewModel",
    ).mockImplementation(() => {
      const real = originalHook();
      return {
        ...real,
        fullText: "",
        hasFullText: false,
      };
    });

    renderWithProviders(<PlatformIntroSection />, TEST_PROVIDER_OPTIONS);
    const page = createPlatformIntroSectionPage();

    expect(page.getSummary()).toBeInTheDocument();
    expect(page.getToggleButton()).not.toBeInTheDocument();
    expect(page.getFullTextContainer()).not.toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it("AC-KAN-4-05: adheres to accessible landmark labels and renders key features", () => {
    renderWithProviders(<PlatformIntroSection />, TEST_PROVIDER_OPTIONS);
    const page = createPlatformIntroSectionPage();

    const section = page.getSection();
    expect(section).toHaveAttribute(
      "aria-labelledby",
      "platform-intro-heading",
    );
    expect(page.getFeatures().length).toBeGreaterThanOrEqual(1);
  });
});
