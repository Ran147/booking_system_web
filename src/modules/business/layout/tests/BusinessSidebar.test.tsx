import { fireEvent, screen } from "@testing-library/react";
import type { RouteObject } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/constants";
import { BUSINESS_STATUS } from "@/domain";
import { fetchBusinessStatus } from "@/modules/business/features/home";
import { renderRoutesWithProviders } from "@/shared/test-utils/renderRoutesWithProviders";
import {
  COLLABORATOR_SESSION,
  SUBSCRIBER_SESSION,
} from "@/shared/test-utils/sessionFixtures";
import { testI18n } from "@/shared/test-utils/testI18n";
import { BusinessLayout } from "../BusinessLayout";
import * as layoutApi from "../api";
import { createBusinessSidebarPage } from "./BusinessSidebar.page";

vi.mock("@/modules/business/features/home", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@/modules/business/features/home",
  );
  return {
    ...actual,
    fetchBusinessStatus: vi.fn(),
  };
});

vi.mock("../api", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("../api");
  return {
    ...actual,
    fetchBusinessProfile: vi.fn(),
    fetchCollaboratorProfile: vi.fn(),
    fetchCurrentSubscription: vi.fn(),
    fetchPlanName: vi.fn(),
    fetchPlatformSettings: vi.fn(),
  };
});

const testRoutes: RouteObject[] = [
  {
    children: [
      {
        element: <div>Dashboard Page Outlet</div>,
        index: true,
      },
      {
        element: <div>Services List Page Outlet</div>,
        path: ROUTE_PATH.BUSINESS.SERVICES,
      },
      {
        element: <div>New Service Form Outlet</div>,
        path: ROUTE_PATH.BUSINESS.SERVICE_NEW,
      },
    ],
    element: <BusinessLayout />,
    path: ROUTE_PATH.BUSINESS.ROOT,
  },
  {
    element: <div>Sign In Page Outlet</div>,
    path: ROUTE_PATH.AUTH.SIGN_IN,
  },
];

describe("BusinessSidebar (KAN-29, KAN-39, KAN-42)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchBusinessStatus).mockResolvedValue(BUSINESS_STATUS.ACTIVE);
    vi.mocked(layoutApi.fetchBusinessProfile).mockResolvedValue({
      logoUrl: null,
      name: "Barbería Central",
      status: BUSINESS_STATUS.ACTIVE,
      timeZone: "America/Costa_Rica",
    });
    vi.mocked(layoutApi.fetchCollaboratorProfile).mockResolvedValue({
      fullName: "Carlos Barbero",
    });
    vi.mocked(layoutApi.fetchCurrentSubscription).mockResolvedValue(null);
    vi.mocked(layoutApi.fetchPlatformSettings).mockResolvedValue({
      gracePeriodDays: 7,
    });
  });

  it("KAN-29: AC-KAN-29-01 renders persistent sidebar navigation landmark and content", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    expect(await page.findSidebarNav()).toBeInTheDocument();
    expect(screen.getByText("Dashboard Page Outlet")).toBeInTheDocument();
  });

  it("KAN-29: AC-KAN-29-02 displays the business name and subscriber role badge", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    expect(await page.findBrandName("Barbería Central")).toBeInTheDocument();
    expect(
      await page.findRoleBadge(testI18n.t("business:home.roleBadge")),
    ).toBeInTheDocument();
  });

  it("KAN-29: AC-KAN-29-03 displays navigation options without subtext descriptions or status tags", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    expect(await page.findDashboardItem()).toBeInTheDocument();
    expect(await page.findCreateServiceItem()).toBeInTheDocument();
    expect(
      screen.queryByText(
        testI18n.t("business:layout.sidebar.servicesDescription"),
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(testI18n.t("business:home.status.available")),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(testI18n.t("business:home.status.comingSoon")),
    ).not.toBeInTheDocument();
  });

  it("KAN-29: AC-KAN-29-04 navigates to services catalog when clicking available tool", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    await page.clickCreateServiceItem();

    expect(
      await screen.findByText("Services List Page Outlet"),
    ).toBeInTheDocument();
  });

  it("KAN-29: AC-KAN-29-04 displays construction placeholder dialog when clicking incomplete tools", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    await page.clickScheduleItem();

    expect(await page.findPlaceholderModalHeading()).toBeInTheDocument();

    await page.clickClosePlaceholderModal();

    expect(page.queryPlaceholderModalHeading()).not.toBeInTheDocument();
  });

  it("KAN-29: AC-KAN-29-05 adapts navigation items for collaborator role by omitting subscriber-only tools", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: COLLABORATOR_SESSION,
    });
    const page = createBusinessSidebarPage();

    expect(await page.findSidebarNav()).toBeInTheDocument();
    expect(
      await page.findRoleBadge(
        testI18n.t("business:home.roleCollaboratorBadge"),
      ),
    ).toBeInTheDocument();

    expect(page.queryCollaboratorsItem()).not.toBeInTheDocument();
    expect(page.querySettingsItem()).not.toBeInTheDocument();
    expect(page.querySubscriptionItem()).not.toBeInTheDocument();
  });

  it("KAN-39: AC-KAN-39-01 displays business logo when logoUrl is available", async () => {
    vi.mocked(layoutApi.fetchBusinessProfile).mockResolvedValueOnce({
      logoUrl: "https://example.com/logo.png",
      name: "Barbería Central",
      status: BUSINESS_STATUS.ACTIVE,
      timeZone: "America/Costa_Rica",
    });

    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    expect(await page.findBusinessLogo("Barbería Central")).toBeInTheDocument();
  });

  it("KAN-39: AC-KAN-39-02 announces network error when business profile fails to load while sign out remains functional", async () => {
    vi.mocked(layoutApi.fetchBusinessProfile).mockRejectedValueOnce(
      new Error("Network offline"),
    );

    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    expect(await page.findNetworkErrorAnnouncement()).toBeInTheDocument();
    await page.clickSignOutButton();
    expect(await screen.findByText("Sign In Page Outlet")).toBeInTheDocument();
  });

  it("KAN-39: AC-KAN-39-03 displays initials fallback when logo fails to load (onError)", async () => {
    vi.mocked(layoutApi.fetchBusinessProfile).mockResolvedValueOnce({
      logoUrl: "https://example.com/broken.png",
      name: "Barbería Central",
      status: BUSINESS_STATUS.ACTIVE,
      timeZone: "America/Costa_Rica",
    });

    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    const imageElement = await page.findBusinessLogo("Barbería Central");
    fireEvent.error(imageElement);

    expect(screen.getByText("BC")).toBeInTheDocument();
  });

  it("KAN-39: AC-KAN-39-04 truncates long business name with title hover attribute", async () => {
    const longName =
      "Barbería y Estética Exclusiva Tradicional Hermanos Mendoza de Costa Rica";
    vi.mocked(layoutApi.fetchBusinessProfile).mockResolvedValueOnce({
      logoUrl: null,
      name: longName,
      status: BUSINESS_STATUS.ACTIVE,
      timeZone: "America/Costa_Rica",
    });

    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    const titleElement = await page.findBrandName(longName);
    expect(titleElement).toHaveAttribute("title", longName);
    expect(titleElement).toHaveClass("truncate");
  });

  it("KAN-39: AC-KAN-39-06 displays collaborator full name when session is collaborator", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: COLLABORATOR_SESSION,
    });
    const page = createBusinessSidebarPage();

    expect(
      await page.findCollaboratorName("Carlos Barbero"),
    ).toBeInTheDocument();
  });

  it("KAN-42: AC-KAN-42-01 allows subscriber to sign out from the sidebar", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    await page.clickSignOutButton();

    expect(await screen.findByText("Sign In Page Outlet")).toBeInTheDocument();
  });

  it("KAN-42: AC-KAN-42-08 allows collaborator to sign out from the sidebar", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: COLLABORATOR_SESSION,
    });
    const page = createBusinessSidebarPage();

    await page.clickSignOutButton();

    expect(await screen.findByText("Sign In Page Outlet")).toBeInTheDocument();
  });
});
