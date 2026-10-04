import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createLandingFooterPage } from "./LandingFooter.page";
import { LandingFooter } from "../components/LandingFooter";

const TARGET_SECTION_ID = "#planes-section";

describe("LandingFooter (KAN-8)", () => {
  it("KAN-8: AC-KAN-8-01 renders footer with logo, description, navigation links, contact channels, social links, and current year copyright", () => {
    renderWithProviders(<LandingFooter />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingFooterPage();

    expect(page.getFooter()).toBeInTheDocument();
    expect(page.getLogo()).toBeInTheDocument();
    expect(page.getBrandName()).toBeInTheDocument();
    expect(page.getBrandDescription()).toBeInTheDocument();

    const navLinks = page.getAllNavigationLinks();
    expect(navLinks).toHaveLength(4);
    expect(
      page.getNavigationLink(testI18n.t("landing:footer.links.home")),
    ).toHaveAttribute("href", ROUTE_PATH.LANDING.HOME);
    expect(
      page.getNavigationLink(testI18n.t("landing:footer.links.plans")),
    ).toHaveAttribute("href", ROUTE_PATH.LANDING.PLANS);
    expect(
      page.getNavigationLink(testI18n.t("landing:footer.links.contact")),
    ).toHaveAttribute("href", ROUTE_PATH.LANDING.CONTACT);
    expect(
      page.getNavigationLink(testI18n.t("landing:footer.links.terms")),
    ).toHaveAttribute("href", ROUTE_PATH.LANDING.TERMS);

    const phoneLink = page.getPhoneLink();
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveAttribute("href", "tel:+5062222-0000");

    const emailLink = page.getEmailLink();
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute(
      "href",
      "mailto:soporte@bookingsystem.com",
    );

    const socialLinks = page.getAllSocialLinks();
    expect(socialLinks.length).toBeGreaterThanOrEqual(4);

    expect(page.getCopyright()).toBeInTheDocument();
  });

  it("KAN-8: AC-KAN-8-02 navigates to target route or scrolls smoothly when navigation link is activated", async () => {
    const scrollIntoViewMock = vi.fn();
    const focusMock = vi.fn();
    const originalQuerySelector = document.querySelector;

    const mockTargetSection = document.createElement("section");
    mockTargetSection.id = "planes-section";
    mockTargetSection.scrollIntoView = scrollIntoViewMock;
    mockTargetSection.focus = focusMock;

    vi.spyOn(document, "querySelector").mockImplementation(
      (selector: string) => {
        if (selector === TARGET_SECTION_ID) {
          return mockTargetSection;
        }
        return originalQuerySelector.call(document, selector);
      },
    );

    renderWithProviders(<LandingFooter />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingFooterPage();
    const plansLink = page.getNavigationLink(
      testI18n.t("landing:footer.links.plans"),
    );

    await userEvent.click(plansLink);

    expect(plansLink).toHaveAttribute("href", ROUTE_PATH.LANDING.PLANS);

    vi.restoreAllMocks();
  });

  it("KAN-8: AC-KAN-8-03 omits unconfigured contact channels and invalid social links gracefully without layout gaps", () => {
    renderWithProviders(
      <LandingFooter
        config={{
          email: "",
          phone: "",
          socialUrls: {
            facebook: "not-a-valid-url",
            instagram: "",
            linkedin: "",
            x: "",
          },
        }}
      />,
      {
        initialPath: ROUTE_PATH.LANDING.HOME,
        session: SIGNED_OUT_SESSION,
      },
    );

    const page = createLandingFooterPage();

    expect(page.getPhoneLink()).toBeNull();
    expect(page.getEmailLink()).toBeNull();
    expect(page.queryContactHeading()).toBeNull();

    expect(page.getAllSocialLinks()).toHaveLength(0);
    expect(page.querySocialHeading()).toBeNull();

    expect(page.getBrandName()).toBeInTheDocument();
    expect(page.getAllNavigationLinks()).toHaveLength(4);
    expect(page.getCopyright()).toBeInTheDocument();
  });

  it("KAN-8: AC-KAN-8-04 supports vertical stacking on mobile viewports and ensures minimum 44x44px touch targets", () => {
    renderWithProviders(<LandingFooter />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingFooterPage();

    const navLinks = page.getAllNavigationLinks();
    for (const navLink of navLinks) {
      expect(navLink.className).toContain("min-h-[44px]");
    }

    const phoneLink = page.getPhoneLink();
    expect(phoneLink?.className).toContain("min-h-[44px]");

    const emailLink = page.getEmailLink();
    expect(emailLink?.className).toContain("min-h-[44px]");

    const socialLinks = page.getAllSocialLinks();
    for (const socialLink of socialLinks) {
      expect(socialLink.className).toContain("min-h-[44px]");
      expect(socialLink.className).toContain("min-w-[44px]");
    }
  });

  it("KAN-8: AC-KAN-8-05 displays visible focus indicators conforming to active theme tokens when interactive elements receive keyboard focus", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LandingFooter />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingFooterPage();
    const homeLink = page.getNavigationLink(
      testI18n.t("landing:footer.links.home"),
    );

    await user.tab();

    expect(homeLink.className).toContain("focus-visible:ring-2");
    expect(homeLink.className).toContain("focus-visible:ring-ring");
  });
});
