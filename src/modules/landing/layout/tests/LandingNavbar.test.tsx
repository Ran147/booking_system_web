import userEvent from "@testing-library/user-event";
import type * as ReactRouter from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import {
  renderWithProviders,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  SUPER_ADMIN_SESSION,
} from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createLandingNavbarPage } from "./LandingNavbar.page";
import { LandingNavbar } from "../components/LandingNavbar";

const TARGET_SECTION_ID = "plans-section";
const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof ReactRouter>("react-router");
  return {
    ...actual,
    useNavigate: (): typeof mockNavigate => mockNavigate,
  };
});

describe("LandingNavbar (KAN-3, KAN-12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("KAN-3: AC-KAN-3-01 renders navbar with logo, brand name, navigation links and Sign In button for signed out visitor", () => {
    renderWithProviders(<LandingNavbar />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingNavbarPage();

    expect(page.getNavbar()).toBeInTheDocument();
    expect(page.getLogo()).toBeInTheDocument();
    expect(page.getBrandName()).toBeInTheDocument();

    const navLinks = page.getAllNavigationLinks();
    expect(navLinks).toHaveLength(3);
    expect(
      page.getNavigationLink(testI18n.t("landing:home.navbar.links.home")),
    ).toHaveAttribute("href", ROUTE_PATH.LANDING.HOME);
    expect(
      page.getNavigationLink(testI18n.t("landing:home.navbar.links.plans")),
    ).toHaveAttribute("href", `${ROUTE_PATH.LANDING.HOME}#plans-section`);
    expect(
      page.getNavigationLink(testI18n.t("landing:home.navbar.links.contact")),
    ).toHaveAttribute("href", ROUTE_PATH.LANDING.CONTACT);

    expect(page.getSignInButton()).toBeInTheDocument();
    expect(page.queryPortalActionButton()).not.toBeInTheDocument();
  });

  it("KAN-3: AC-KAN-3-02 navigates to sign-in route when visitor clicks Sign In button", async () => {
    renderWithProviders(<LandingNavbar />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingNavbarPage();
    await page.clickSignInButton();

    expect(mockNavigate).toHaveBeenCalledWith(ROUTE_PATH.AUTH.SIGN_IN);
  });

  it("KAN-3: AC-KAN-3-03 scrolls smoothly to section when hash link is clicked or navigates gracefully", async () => {
    const scrollIntoViewMock = vi.fn();
    const originalGetElementById = document.getElementById;

    const mockTargetSection = document.createElement("section");
    mockTargetSection.id = "plans-section";
    mockTargetSection.scrollIntoView = scrollIntoViewMock;

    vi.spyOn(document, "getElementById").mockImplementation((id: string) => {
      if (id === TARGET_SECTION_ID) {
        return mockTargetSection;
      }
      return originalGetElementById.call(document, id);
    });

    renderWithProviders(<LandingNavbar />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingNavbarPage();
    await page.clickNavigationLink(
      testI18n.t("landing:home.navbar.links.plans"),
    );

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth" });

    vi.restoreAllMocks();
  });

  it("KAN-3: AC-KAN-3-04 adapts action button and target path when user is signed in with subscriber or super admin role", async () => {
    const { unmount } = renderWithProviders(<LandingNavbar />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SUBSCRIBER_SESSION,
    });

    let page = createLandingNavbarPage();
    expect(page.querySignInButton()).not.toBeInTheDocument();
    expect(page.getPortalActionButton()).toBeInTheDocument();

    await page.clickPortalActionButton();
    expect(mockNavigate).toHaveBeenCalledWith(ROUTE_PATH.BUSINESS.ROOT);

    unmount();
    mockNavigate.mockClear();

    renderWithProviders(<LandingNavbar />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SUPER_ADMIN_SESSION,
    });

    page = createLandingNavbarPage();
    expect(page.getPortalActionButton()).toBeInTheDocument();

    await page.clickPortalActionButton();
    expect(mockNavigate).toHaveBeenCalledWith(ROUTE_PATH.ADMIN.ROOT);
  });

  it("KAN-3: AC-KAN-3-05 toggles mobile menu and closes on Escape or link activation with accessible attributes", async () => {
    renderWithProviders(<LandingNavbar />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingNavbarPage();
    const toggleButton = page.getMobileMenuToggleButton();

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(page.getMobileMenu()).not.toBeInTheDocument();

    await page.clickMobileMenuToggle();

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    expect(page.getMobileMenu()).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(page.getMobileMenu()).not.toBeInTheDocument();
  });

  it("KAN-3: AC-KAN-3-06 applies semantic styling tokens supporting dark and light themes", () => {
    renderWithProviders(<LandingNavbar className="custom-test-class" />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingNavbarPage();
    const navbar = page.getNavbar();

    expect(navbar).toHaveClass("sticky");
    expect(navbar).toHaveClass("top-0");
    expect(navbar).toHaveClass("border-border");
    expect(navbar).toHaveClass("bg-background/95");
    expect(navbar).toHaveClass("custom-test-class");
  });

  it("KAN-12: AC-KAN-12-01 renders company logo with accessible text and link to home", () => {
    renderWithProviders(<LandingNavbar />, {
      initialPath: ROUTE_PATH.LANDING.HOME,
      session: SIGNED_OUT_SESSION,
    });

    const page = createLandingNavbarPage();
    const logo = page.getLogo();

    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute(
      "aria-label",
      testI18n.t("landing:home.navbar.logoAlt"),
    );

    const homeLink = page.getNavigationLink(
      `${testI18n.t("landing:home.navbar.links.home")}`,
    );
    expect(homeLink).toHaveAttribute("href", ROUTE_PATH.LANDING.HOME);
  });
});
