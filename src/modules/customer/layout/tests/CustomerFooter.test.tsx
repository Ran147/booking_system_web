import { screen } from "@testing-library/react";
import { ROUTE_PATH } from "@/constants";
import {
  renderWithProviders,
  SIGNED_OUT_SESSION,
  testI18n,
} from "@/test-utils";
import { CustomerLayout } from "../CustomerLayout";
import { CustomerFooter } from "../components";
import type { CustomerFooterBusiness } from "../models";
import { createCustomerFooterPage } from "./CustomerFooter.page";

const BUSINESS_NAME = "Barbería Central";
const COMPLETE_BUSINESS = {
  contactEmail: "contacto@negocio.test",
  contactPhone: "+506 2222-3333",
  logoUrl: "https://example.test/logo.webp",
  name: BUSINESS_NAME,
  socialLinks: [
    { network: "Instagram", url: "https://instagram.com/negocio" },
    { network: "Facebook", url: "http://facebook.com/inseguro" },
    { network: "Sitio web", url: "https://negocio.test" },
  ],
} as const satisfies CustomerFooterBusiness;

const renderFooter = (business?: CustomerFooterBusiness): void => {
  renderWithProviders(<CustomerFooter business={business} />, {
    initialPath: "/barberia-central",
    session: SIGNED_OUT_SESSION,
  });
};

describe("CustomerFooter", () => {
  it("KAN-118 KAN-120 KAN-121: renders complete public business data", () => {
    renderFooter(COMPLETE_BUSINESS);
    const page = createCustomerFooterPage();

    expect(page.getLogo()).toHaveAccessibleName(BUSINESS_NAME);
    expect(page.getPhoneLink()).toHaveAttribute("href", "tel:+5062222-3333");
    expect(page.getEmailLink()).toHaveAttribute(
      "href",
      "mailto:contacto@negocio.test",
    );
    expect(page.getSocialLink("Instagram", BUSINESS_NAME)).toHaveAttribute(
      "href",
      "https://instagram.com/negocio",
    );
    expect(page.getSocialLink("Sitio web", BUSINESS_NAME)).toHaveAttribute(
      "href",
      "https://negocio.test",
    );
    expect(
      screen.queryByRole("link", { name: /Facebook/u }),
    ).not.toBeInTheDocument();
  });

  it("KAN-118 KAN-120: hides optional sections when they have no data", () => {
    renderFooter({ name: BUSINESS_NAME });
    const page = createCustomerFooterPage();

    expect(page.queryContactHeading()).not.toBeInTheDocument();
    expect(page.querySocialHeading()).not.toBeInTheDocument();
    expect(page.queryLogo()).not.toBeInTheDocument();
    expect(screen.getByText(BUSINESS_NAME)).toBeInTheDocument();
  });

  it("KAN-121: falls back to the business name when the logo fails", () => {
    renderFooter(COMPLETE_BUSINESS);
    const page = createCustomerFooterPage();

    page.failLogoLoad();

    expect(page.queryLogo()).not.toBeInTheDocument();
    expect(screen.getByText(BUSINESS_NAME)).toBeInTheDocument();
  });

  it("KAN-120: opens valid social links in a secure new tab", () => {
    renderFooter(COMPLETE_BUSINESS);
    const socialLink = createCustomerFooterPage().getSocialLink(
      "Instagram",
      BUSINESS_NAME,
    );

    expect(socialLink).toHaveAttribute("target", "_blank");
    expect(socialLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("KAN-119: links to the official terms route without replacing the page", () => {
    renderFooter();
    const termsLink = createCustomerFooterPage().getTermsLink();

    expect(termsLink).toHaveAttribute("href", ROUTE_PATH.LANDING.TERMS);
    expect(termsLink).toHaveAttribute("target", "_blank");
    expect(termsLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("KAN-118: renders no invented business data when the profile is absent", () => {
    renderFooter();
    const page = createCustomerFooterPage();

    expect(page.queryContactHeading()).not.toBeInTheDocument();
    expect(page.querySocialHeading()).not.toBeInTheDocument();
    expect(page.queryLogo()).not.toBeInTheDocument();
    expect(page.getTermsLink()).toBeInTheDocument();
  });

  it("KAN-119: integrates the accessible footer into CustomerLayout", () => {
    renderWithProviders(<CustomerLayout />, {
      initialPath: "/barberia-central",
      session: SIGNED_OUT_SESSION,
    });

    expect(createCustomerFooterPage().getFooter()).toBeInTheDocument();
    expect(
      screen.getByText(testI18n.t("customer:layout.title")),
    ).toBeInTheDocument();
  });
});
