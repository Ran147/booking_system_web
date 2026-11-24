import { describe, expect, it } from "vitest";
import { FOOTER_SOCIAL_NETWORK } from "@/modules/landing/layout/constants";
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/test-utils";
import { createContactDirectChannelsPage } from "./ContactDirectChannels.page";
import { ContactDirectChannels } from "../components/ContactDirectChannels";

describe("ContactDirectChannels (US-17 / KAN-17)", () => {
  it("AC-KAN-17-01: renders email, phone and social media links with canonical defaults", () => {
    renderWithProviders(<ContactDirectChannels />, {
      initialPath: ROUTE_PATH.LANDING.CONTACT,
      session: SIGNED_OUT_SESSION,
    });

    const page = createContactDirectChannelsPage();

    expect(page.queryCard()).toBeInTheDocument();

    const emailLink = page.getEmailLink();
    expect(emailLink).toHaveAttribute(
      "href",
      "mailto:soporte@bookingsystem.com",
    );
    expect(emailLink).toHaveAttribute(
      "aria-label",
      expect.stringContaining("soporte@bookingsystem.com"),
    );

    const phoneLink = page.getPhoneLink();
    expect(phoneLink).toHaveAttribute("href", "tel:+5062222-0000");
    expect(phoneLink).toHaveAttribute(
      "aria-label",
      expect.stringContaining("+506 2222-0000"),
    );

    const facebookLink = page.getSocialLink(FOOTER_SOCIAL_NETWORK.FACEBOOK);
    expect(facebookLink).toHaveAttribute(
      "href",
      "https://facebook.com/bookingsystem",
    );
    expect(facebookLink).toHaveAttribute("target", "_blank");
    expect(facebookLink).toHaveAttribute("rel", "noopener noreferrer");

    const instagramLink = page.getSocialLink(FOOTER_SOCIAL_NETWORK.INSTAGRAM);
    expect(instagramLink).toHaveAttribute(
      "href",
      "https://instagram.com/bookingsystem",
    );
    expect(instagramLink).toHaveAttribute("target", "_blank");
    expect(instagramLink).toHaveAttribute("rel", "noopener noreferrer");

    const linkedinLink = page.getSocialLink(FOOTER_SOCIAL_NETWORK.LINKEDIN);
    expect(linkedinLink).toHaveAttribute(
      "href",
      "https://linkedin.com/company/bookingsystem",
    );
    expect(linkedinLink).toHaveAttribute("target", "_blank");

    const xLink = page.getSocialLink(FOOTER_SOCIAL_NETWORK.X);
    expect(xLink).toHaveAttribute("href", "https://x.com/bookingsystem");
    expect(xLink).toHaveAttribute("target", "_blank");
  });

  it("AC-KAN-17-03: omits phone when unconfigured or empty", () => {
    renderWithProviders(
      <ContactDirectChannels
        configOverride={{
          email: "custom@example.com",
          phone: "   ",
          socialUrls: {},
        }}
      />,
      {
        initialPath: ROUTE_PATH.LANDING.CONTACT,
        session: SIGNED_OUT_SESSION,
      },
    );

    const page = createContactDirectChannelsPage();

    expect(page.queryPhoneLink()).not.toBeInTheDocument();
    expect(page.getEmailLink()).toHaveAttribute(
      "href",
      "mailto:custom@example.com",
    );
    expect(page.getSocialLinks()).toHaveLength(0);
  });

  it("AC-KAN-17-03: omits email when unconfigured or empty", () => {
    renderWithProviders(
      <ContactDirectChannels
        configOverride={{
          email: "",
          phone: "+506 8888-8888",
          socialUrls: {},
        }}
      />,
      {
        initialPath: ROUTE_PATH.LANDING.CONTACT,
        session: SIGNED_OUT_SESSION,
      },
    );

    const page = createContactDirectChannelsPage();

    expect(page.queryEmailLink()).not.toBeInTheDocument();
    expect(page.getPhoneLink()).toHaveAttribute("href", "tel:+5068888-8888");
  });

  it("AC-KAN-17-03: omits invalid or non-http social links", () => {
    renderWithProviders(
      <ContactDirectChannels
        configOverride={{
          email: "test@example.com",
          phone: "+506 1111-2222",
          socialUrls: {
            facebook: "javascript:alert(1)",
            instagram: "not-a-valid-url",
            linkedin: "https://linkedin.com/company/valid",
            x: "",
          },
        }}
      />,
      {
        initialPath: ROUTE_PATH.LANDING.CONTACT,
        session: SIGNED_OUT_SESSION,
      },
    );

    const page = createContactDirectChannelsPage();

    expect(page.getSocialLinks()).toHaveLength(1);
    expect(
      page.getSocialLink(FOOTER_SOCIAL_NETWORK.LINKEDIN),
    ).toBeInTheDocument();
  });

  it("AC-KAN-17-04: returns null if all direct channels are empty", () => {
    renderWithProviders(
      <ContactDirectChannels
        configOverride={{
          email: "",
          phone: "",
          socialUrls: {},
        }}
      />,
      {
        initialPath: ROUTE_PATH.LANDING.CONTACT,
        session: SIGNED_OUT_SESSION,
      },
    );

    const page = createContactDirectChannelsPage();
    expect(page.queryCard()).not.toBeInTheDocument();
  });
});
