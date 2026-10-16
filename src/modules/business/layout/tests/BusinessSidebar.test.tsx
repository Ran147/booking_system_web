import { screen } from "@testing-library/react";
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
      {
        element: <div>Settings Page Outlet</div>,
        path: ROUTE_PATH.BUSINESS.SETTINGS,
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

describe("BusinessSidebar (KAN-29)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchBusinessStatus).mockResolvedValue(BUSINESS_STATUS.ACTIVE);
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

    expect(
      await page.findBrandName(testI18n.t("business:placeholder.title")),
    ).toBeInTheDocument();
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

  it("KAN-51: navigates to settings without opening the placeholder dialog", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    await page.clickSettingsItem();

    expect(await screen.findByText("Settings Page Outlet")).toBeInTheDocument();
    expect(page.queryPlaceholderModalHeading()).not.toBeInTheDocument();
  });

  it("KAN-51: marks settings as active at its registered route", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    expect(await page.findSettingsItem()).toHaveClass("bg-primary/10");
    expect(screen.getByText("Settings Page Outlet")).toBeInTheDocument();
  });

  it("KAN-51: navigates from the mobile drawer and closes it", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    await page.clickOpenMenuButton();
    await page.clickMobileSettingsItem();

    expect(await screen.findByText("Settings Page Outlet")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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

  it("KAN-51: keeps direct settings access for collaborators without exposing the sidebar item", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS}`,
      session: COLLABORATOR_SESSION,
    });
    const page = createBusinessSidebarPage();

    expect(await screen.findByText("Settings Page Outlet")).toBeInTheDocument();
    expect(page.querySettingsItem()).not.toBeInTheDocument();
  });

  it("KAN-29: AC-KAN-29-08 allows user to sign out from the sidebar", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessSidebarPage();

    await page.clickSignOutButton();

    expect(await screen.findByText("Sign In Page Outlet")).toBeInTheDocument();
  });
});
