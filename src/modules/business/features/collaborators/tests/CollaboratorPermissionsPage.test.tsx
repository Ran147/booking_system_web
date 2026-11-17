import { screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { RouteObject } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/constants";
import {
  BUSINESS_STATUS,
  COLLABORATOR_PERMISSION,
  COLLABORATOR_STATUS,
} from "@/domain";
import { businessRoutes } from "@/modules/business/business.routes";
import { fetchBusinessStatus } from "@/modules/business/features/home";
import * as businessLayoutApi from "@/modules/business/layout/api";
import { renderRoutesWithProviders } from "@/shared/test-utils/renderRoutesWithProviders";
import {
  COLLABORATOR_SESSION,
  SUBSCRIBER_SESSION,
} from "@/shared/test-utils/sessionFixtures";
import { createCollaboratorPermissionsPage } from "./CollaboratorPermissionsPage.page";
import * as collaboratorClient from "../api/collaboratorClient";
import { fetchCollaboratorDetail } from "../api/fetchCollaboratorDetail";
import { fetchCollaboratorUsage } from "../api/fetchCollaboratorUsage";
import { CollaboratorPermissionsPage } from "../pages/CollaboratorPermissionsPage";

vi.mock("../api/fetchCollaboratorDetail", () => ({
  fetchCollaboratorDetail: vi.fn(),
}));

vi.mock("../api/fetchCollaboratorUsage", () => ({
  fetchCollaboratorUsage: vi.fn(),
}));

vi.mock("../api/collaboratorClient", async () => {
  const actual = await vi.importActual<typeof collaboratorClient>(
    "../api/collaboratorClient",
  );
  return {
    ...actual,
    updateCollaboratorPermissions: vi.fn(),
  };
});

vi.mock("@/modules/business/features/home", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@/modules/business/features/home",
  );
  return {
    ...actual,
    BusinessHomePage: (): ReactElement => <div>Business Home Outlet</div>,
    fetchBusinessStatus: vi.fn(),
  };
});

vi.mock("@/modules/business/layout/api", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@/modules/business/layout/api",
  );
  return {
    ...actual,
    fetchBusinessGate: vi.fn(),
    fetchBusinessProfile: vi.fn(),
    fetchCollaboratorProfile: vi.fn(),
    fetchCurrentSubscription: vi.fn(),
    fetchPlatformSettings: vi.fn(),
    useBusinessGateQuery: (): {
      ["data"]: {
        name: string;
        rejectionReason: null;
        signedUpAt: Date;
        status: string;
        timeZone: string;
      };
      isError: boolean;
      isPending: boolean;
    } => ({
      ["data"]: {
        name: "Salon Central",
        rejectionReason: null,
        signedUpAt: new Date("2026-10-01T00:00:00.000Z"),
        status: BUSINESS_STATUS.ACTIVE,
        timeZone: "America/Costa_Rica",
      },
      isError: false,
      isPending: false,
    }),
  };
});

const permissionsRoutes: RouteObject[] = [
  {
    element: <CollaboratorPermissionsPage />,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_PERMISSIONS}`,
  },
  {
    element: <div>Collaborator Detail Route</div>,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_DETAIL}`,
  },
];

describe("CollaboratorPermissionsPage (KAN-86)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchCollaboratorUsage).mockResolvedValue({
      hasHigherPlan: false,
      isReadOnly: false,
      limit: 5,
      used: 1,
    });
    vi.mocked(fetchCollaboratorDetail).mockResolvedValue({
      businessId: SUBSCRIBER_SESSION.businessId,
      email: "ana@salon.com",
      fullName: "Ana Perez",
      id: "collab-1",
      lastEmailSentAt: null,
      permissions: [COLLABORATOR_PERMISSION.MANAGE_BOOKINGS],
      phone: "+50688887777",
      serviceIds: ["service-1"],
      services: [{ id: "service-1", name: "Corte" }],
      specialty: null,
      status: COLLABORATOR_STATUS.ACTIVE,
      upcomingBookingsByService: {},
      upcomingBookingsCount: 0,
      upcomingServiceIdsWithBookings: [],
      updatedAt: "2026-11-01T10:00:00.000Z",
      userId: "user-1",
    });
    vi.mocked(fetchBusinessStatus).mockResolvedValue(BUSINESS_STATUS.ACTIVE);
    vi.mocked(businessLayoutApi.fetchBusinessGate).mockResolvedValue({
      name: "Salon Central",
      rejectionReason: null,
      signedUpAt: new Date("2026-10-01T00:00:00.000Z"),
      status: BUSINESS_STATUS.ACTIVE,
      timeZone: "America/Costa_Rica",
    });
    vi.mocked(businessLayoutApi.fetchBusinessProfile).mockResolvedValue({
      logoUrl: null,
      name: "Salon Central",
      status: BUSINESS_STATUS.ACTIVE,
      timeZone: "America/Costa_Rica",
    });
    vi.mocked(businessLayoutApi.fetchCurrentSubscription).mockResolvedValue(
      null,
    );
    vi.mocked(businessLayoutApi.fetchPlatformSettings).mockResolvedValue({
      gracePeriodDays: 7,
    });
  });

  it("KAN-86: toggles collaborator permissions and submits update", async () => {
    vi.mocked(
      collaboratorClient.updateCollaboratorPermissions,
    ).mockResolvedValue({
      collaboratorId: "collab-1",
      permissions: [
        COLLABORATOR_PERMISSION.MANAGE_BOOKINGS,
        COLLABORATOR_PERMISSION.MANAGE_SERVICES,
      ],
    });

    renderRoutesWithProviders(permissionsRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/collaborators/collab-1/permissions`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorPermissionsPage();

    const manageBookingsCheckbox = await page.findPermissionCheckbox(
      COLLABORATOR_PERMISSION.MANAGE_BOOKINGS,
    );
    expect(manageBookingsCheckbox).toBeChecked();

    await page.togglePermission(COLLABORATOR_PERMISSION.MANAGE_SERVICES);
    await page.clickSave();

    await waitFor(() => {
      expect(
        collaboratorClient.updateCollaboratorPermissions,
      ).toHaveBeenCalledWith({
        businessId: SUBSCRIBER_SESSION.businessId,
        collaboratorId: "collab-1",
        permissions: [
          COLLABORATOR_PERMISSION.MANAGE_BOOKINGS,
          COLLABORATOR_PERMISSION.MANAGE_SERVICES,
        ],
      });
    });

    expect(
      await screen.findByText("Collaborator Detail Route"),
    ).toBeInTheDocument();
  });

  it("KAN-86: AC-KAN-86-03 redirects collaborator without manage_services away from /business/services", async () => {
    vi.mocked(businessLayoutApi.fetchCollaboratorProfile).mockResolvedValue({
      fullName: "Carlos Barbero",
      permissions: [COLLABORATOR_PERMISSION.MANAGE_BOOKINGS],
    });

    renderRoutesWithProviders(businessRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SERVICES}`,
      session: COLLABORATOR_SESSION,
    });

    expect(await screen.findByText("Business Home Outlet")).toBeInTheDocument();
  });

  it("KAN-86: AC-KAN-86-05 redirects collaborator away from subscriber-only /business/collaborators route", async () => {
    vi.mocked(businessLayoutApi.fetchCollaboratorProfile).mockResolvedValue({
      fullName: "Carlos Barbero",
      permissions: [
        COLLABORATOR_PERMISSION.MANAGE_SERVICES,
        COLLABORATOR_PERMISSION.MANAGE_BOOKINGS,
      ],
    });

    renderRoutesWithProviders(businessRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
      session: COLLABORATOR_SESSION,
    });

    expect(await screen.findByText("Business Home Outlet")).toBeInTheDocument();
  });
});
