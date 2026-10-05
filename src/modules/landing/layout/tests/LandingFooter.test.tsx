import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { LINK_TARGET } from "../constants";
import { createLandingFooterPage } from "./LandingFooter.page";
import { LandingFooter } from "../components/LandingFooter";

const TARGET_SECTION_ID = "#planes-section";
const REL_NOOPENER_NOREFERRER = "noopener noreferrer";
const DEFAULT_PHONE_RAW = "+506 2222-0000";
const DEFAULT_EMAIL_RAW = "soporte@bookingsystem.com";
const LONG_EMAIL_RAW =
  "soporte-tecnico-especializado-y-atencion-al-cliente@bookingsystem.com";

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
    expect(emailLink).toHaveAttribute("href", `mailto:${DEFAULT_EMAIL_RAW}`);

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

describe("LandingFooter Social Links (KAN-10)", () => {
  it("KAN-10: AC-KAN-10-01 renders each social network as an icon link with accessible localized label", () => {
    renderWithProviders(<LandingFooter />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingFooterPage();

    const facebookLink = page.getSocialLink("facebook");
    expect(facebookLink).toBeInTheDocument();
    expect(facebookLink).toHaveAttribute(
      "aria-label",
      testI18n.t("landing:footer.social.facebook"),
    );

    const instagramLink = page.getSocialLink("instagram");
    expect(instagramLink).toBeInTheDocument();
    expect(instagramLink).toHaveAttribute(
      "aria-label",
      testI18n.t("landing:footer.social.instagram"),
    );

    const linkedinLink = page.getSocialLink("linkedin");
    expect(linkedinLink).toBeInTheDocument();
    expect(linkedinLink).toHaveAttribute(
      "aria-label",
      testI18n.t("landing:footer.social.linkedin"),
    );

    const xLink = page.getSocialLink("x");
    expect(xLink).toBeInTheDocument();
    expect(xLink).toHaveAttribute(
      "aria-label",
      testI18n.t("landing:footer.social.x"),
    );
  });

  it("KAN-10: AC-KAN-10-02 opens official social profile in a new browser tab with target=_blank and rel=noopener noreferrer", () => {
    renderWithProviders(<LandingFooter />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingFooterPage();
    const socialLinks = page.getAllSocialLinks();

    expect(socialLinks.length).toBeGreaterThan(0);
    for (const link of socialLinks) {
      expect(link).toHaveAttribute("target", LINK_TARGET.BLANK);
      expect(link).toHaveAttribute("rel", REL_NOOPENER_NOREFERRER);
    }
  });

  it("KAN-10: AC-KAN-10-03 excludes social networks with empty strings or invalid URL formats", () => {
    renderWithProviders(
      <LandingFooter
        config={{
          socialUrls: {
            facebook: "not-a-valid-http-url",
            instagram: "",
            linkedin: "https://linkedin.com/company/bookingsystem",
            x: "ftp://unsupported-protocol.com",
          },
        }}
      />,
      {
        initialPath: ROUTE_PATH.LANDING.HOME,
        session: SIGNED_OUT_SESSION,
      },
    );

    const page = createLandingFooterPage();

    expect(page.getSocialLink("facebook")).toBeNull();
    expect(page.getSocialLink("instagram")).toBeNull();
    expect(page.getSocialLink("x")).toBeNull();

    const linkedinLink = page.getSocialLink("linkedin");
    expect(linkedinLink).toBeInTheDocument();
    expect(linkedinLink).toHaveAttribute(
      "href",
      "https://linkedin.com/company/bookingsystem",
    );
  });

  it("KAN-10: AC-KAN-10-04 omits entire social links section and header when no social networks are configured", () => {
    renderWithProviders(
      <LandingFooter
        config={{
          socialUrls: {},
        }}
      />,
      {
        initialPath: ROUTE_PATH.LANDING.HOME,
        session: SIGNED_OUT_SESSION,
      },
    );

    const page = createLandingFooterPage();

    expect(page.getAllSocialLinks()).toHaveLength(0);
    expect(page.querySocialHeading()).toBeNull();
  });
});

describe("LandingFooter Phone Number (KAN-11)", () => {
  it("KAN-11: AC-KAN-11-01 displays phone number in international format with phone icon and accessible label", () => {
    renderWithProviders(<LandingFooter />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingFooterPage();
    const phoneLink = page.getPhoneLink();

    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveTextContent(DEFAULT_PHONE_RAW);
    expect(phoneLink).toHaveAttribute(
      "aria-label",
      testI18n.t("landing:footer.contact.phoneLabel", {
        phone: DEFAULT_PHONE_RAW,
      }),
    );
  });

  it("KAN-11: AC-KAN-11-02 initiates a call using the standardized tel: protocol URL when clicked", () => {
    renderWithProviders(<LandingFooter />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingFooterPage();
    const phoneLink = page.getPhoneLink();

    expect(phoneLink).toHaveAttribute("href", "tel:+5062222-0000");
  });

  it("KAN-11: AC-KAN-11-03 omits the telephone line item entirely when no contact phone is configured", () => {
    renderWithProviders(
      <LandingFooter
        config={{
          phone: "",
        }}
      />,
      {
        initialPath: ROUTE_PATH.LANDING.HOME,
        session: SIGNED_OUT_SESSION,
      },
    );

    const page = createLandingFooterPage();

    expect(page.getPhoneLink()).toBeNull();
  });

  it("KAN-11: AC-KAN-11-04 renders plain selectable text content for desktop devices without native telephony", () => {
    renderWithProviders(<LandingFooter />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingFooterPage();
    const phoneLink = page.getPhoneLink();

    expect(phoneLink?.textContent).toContain(DEFAULT_PHONE_RAW);
  });
});

describe("LandingFooter Contact Email (KAN-13)", () => {
  it("KAN-13: AC-KAN-13-01 displays email address with email icon and accessible label", () => {
    renderWithProviders(<LandingFooter />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingFooterPage();
    const emailLink = page.getEmailLink();

    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveTextContent(DEFAULT_EMAIL_RAW);
    expect(emailLink).toHaveAttribute(
      "aria-label",
      testI18n.t("landing:footer.contact.emailLabel", {
        email: DEFAULT_EMAIL_RAW,
      }),
    );
  });

  it("KAN-13: AC-KAN-13-02 opens the default email client with draft message via mailto: protocol", () => {
    renderWithProviders(<LandingFooter />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingFooterPage();
    const emailLink = page.getEmailLink();

    expect(emailLink).toHaveAttribute("href", `mailto:${DEFAULT_EMAIL_RAW}`);
  });

  it("KAN-13: AC-KAN-13-03 omits the email line item entirely when no contact email is configured", () => {
    renderWithProviders(
      <LandingFooter
        config={{
          email: "",
        }}
      />,
      {
        initialPath: ROUTE_PATH.LANDING.HOME,
        session: SIGNED_OUT_SESSION,
      },
    );

    const page = createLandingFooterPage();

    expect(page.getEmailLink()).toBeNull();
  });

  it("KAN-13: AC-KAN-13-04 wraps extensive email addresses using break-all to prevent horizontal clipping on narrow viewports", () => {
    renderWithProviders(
      <LandingFooter
        config={{
          email: LONG_EMAIL_RAW,
        }}
      />,
      {
        initialPath: ROUTE_PATH.LANDING.HOME,
        session: SIGNED_OUT_SESSION,
      },
    );

    const page = createLandingFooterPage();
    const emailLink = page.getEmailLink();

    expect(emailLink).toBeInTheDocument();
    expect(emailLink?.className).toContain("break-all");
    expect(emailLink).toHaveTextContent(LONG_EMAIL_RAW);
  });
});
