import type { BusinessPublicProfile } from "@/domain";
import { BUSINESS_STATUS } from "@/domain";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/test-utils";
import type { Nullable } from "@/types";
import { CustomerNavbar } from "../components";
import { createCustomerNavbarPage } from "./CustomerNavbar.page";

const BUSINESS_PROFILE = {
  contactEmail: null,
  contactPhone: null,
  description: null,
  id: "business-id",
  logoUrl: "https://cdn.example.test/logo.webp",
  name: "Negocio con un nombre extraordinariamente largo para una pantalla pequena",
  slug: "negocio-real",
  socialLinks: [],
  status: BUSINESS_STATUS.ACTIVE,
} satisfies BusinessPublicProfile;

const renderNavbar = (business: Nullable<BusinessPublicProfile>): void => {
  renderWithProviders(<CustomerNavbar business={business} />, {
    initialPath: `/${BUSINESS_PROFILE.slug}`,
    session: SIGNED_OUT_SESSION,
  });
};

describe("CustomerNavbar", () => {
  it("AC-KAN-107-01: identifies the business with an accessible logo and name", () => {
    renderNavbar(BUSINESS_PROFILE);
    const navbar = createCustomerNavbarPage();

    expect(navbar.getNavigation()).toBeInTheDocument();
    expect(navbar.getLogo(BUSINESS_PROFILE.name)).toHaveAttribute(
      "src",
      BUSINESS_PROFILE.logoUrl,
    );
    expect(navbar.getBusinessHomeLink(BUSINESS_PROFILE.name)).toHaveAttribute(
      "href",
      `/${BUSINESS_PROFILE.slug}`,
    );
  });

  it("AC-KAN-107-04: removes a failed logo without hiding the business name", () => {
    renderNavbar(BUSINESS_PROFILE);
    const navbar = createCustomerNavbarPage();

    navbar.failLogoLoad(BUSINESS_PROFILE.name);

    expect(navbar.queryLogo(BUSINESS_PROFILE.name)).not.toBeInTheDocument();
    expect(navbar.getBusinessHomeLink(BUSINESS_PROFILE.name)).toHaveTextContent(
      BUSINESS_PROFILE.name,
    );
  });

  it("AC-KAN-107-04: shows the business name when no logo is configured", () => {
    renderNavbar({ ...BUSINESS_PROFILE, logoUrl: null });
    const navbar = createCustomerNavbarPage();

    expect(navbar.queryLogo(BUSINESS_PROFILE.name)).not.toBeInTheDocument();
    expect(navbar.getBusinessHomeLink(BUSINESS_PROFILE.name)).toHaveTextContent(
      BUSINESS_PROFILE.name,
    );
  });

  it("AC-KAN-107-05: keeps a long full name available to assistive technology", () => {
    renderNavbar(BUSINESS_PROFILE);
    const navbar = createCustomerNavbarPage();

    expect(navbar.getBusinessHomeLink(BUSINESS_PROFILE.name)).toHaveTextContent(
      BUSINESS_PROFILE.name,
    );
  });

  it("AC-KAN-107-02: exposes no invented identity without business data", () => {
    renderNavbar(null);
    const navbar = createCustomerNavbarPage();

    expect(navbar.getNavigation()).toBeInTheDocument();
    expect(
      navbar.queryBusinessHomeLink(BUSINESS_PROFILE.name),
    ).not.toBeInTheDocument();
  });
});
