import { screen, waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import type { RouteObject } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FIREBASE_ERROR_CODE, ROUTE_PATH } from "@/constants";
import { COLLABORATOR_PERMISSION, COLLABORATOR_STATUS } from "@/domain";
import { renderRoutesWithProviders } from "@/shared/test-utils/renderRoutesWithProviders";
import { SUBSCRIBER_SESSION } from "@/shared/test-utils/sessionFixtures";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createCollaboratorListPage } from "./CollaboratorListPage.page";
import * as collaboratorClient from "../api/collaboratorClient";
import { fetchActiveServicesForCollaborator } from "../api/fetchActiveServicesForCollaborator";
import { fetchCollaboratorDetail } from "../api/fetchCollaboratorDetail";
import { fetchCollaboratorListPage } from "../api/fetchCollaboratorListPage";
import { fetchCollaboratorUsage } from "../api/fetchCollaboratorUsage";
import { COLLABORATOR_ERROR_REASON } from "../constants/CollaboratorFeature.constants";
import type { CollaboratorListItem } from "../models";
import { CollaboratorListPage } from "../pages/CollaboratorListPage";

vi.mock("../api/fetchCollaboratorListPage", () => ({
  fetchCollaboratorListPage: vi.fn(),
}));

vi.mock("../api/fetchCollaboratorUsage", () => ({
  fetchCollaboratorUsage: vi.fn(),
}));

vi.mock("../api/fetchCollaboratorDetail", () => ({
  fetchCollaboratorDetail: vi.fn(),
}));

vi.mock("../api/fetchActiveServicesForCollaborator", () => ({
  fetchActiveServicesForCollaborator: vi.fn(),
}));

vi.mock("../api/collaboratorClient", async () => {
  const actual = await vi.importActual<typeof collaboratorClient>(
    "../api/collaboratorClient",
  );
  return {
    ...actual,
    resendCollaboratorEmail: vi.fn(),
    updateCollaboratorStatus: vi.fn(),
  };
});

const listRoutes: RouteObject[] = [
  {
    element: <CollaboratorListPage />,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
  },
  {
    element: <div>New Collaborator Route</div>,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_NEW}`,
  },
  {
    element: <div>Collaborator Detail Route</div>,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_DETAIL}`,
  },
  {
    element: <div>Collaborator Edit Route</div>,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_EDIT}`,
  },
  {
    element: <div>Collaborator Permissions Route</div>,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_PERMISSIONS}`,
  },
  {
    element: <div>Upgrade Plans Route</div>,
    path: ROUTE_PATH.LANDING.PLANS,
  },
];

const ACTIVE_COLLABORATOR: CollaboratorListItem = {
  email: "ana@salon.com",
  fullName: "Ana Perez",
  id: "collab-1",
  lastEmailSentAt: null,
  permissions: [COLLABORATOR_PERMISSION.MANAGE_BOOKINGS],
  phone: "+50688887777",
  serviceIds: ["service-1"],
  specialty: "Colorista",
  status: COLLABORATOR_STATUS.ACTIVE,
};

const INVITED_COLLABORATOR: CollaboratorListItem = {
  email: "luis@salon.com",
  fullName: "Luis Mora",
  id: "collab-2",
  lastEmailSentAt: null,
  permissions: [],
  phone: "+50688886666",
  serviceIds: ["service-1"],
  specialty: null,
  status: COLLABORATOR_STATUS.INVITED,
};

const INACTIVE_COLLABORATOR: CollaboratorListItem = {
  email: "sofia@salon.com",
  fullName: "Sofia Rojas",
  id: "collab-3",
  lastEmailSentAt: null,
  permissions: [],
  phone: "+50688885555",
  serviceIds: ["service-1"],
  specialty: null,
  status: COLLABORATOR_STATUS.INACTIVE,
};

describe("CollaboratorListPage (KAN-81..KAN-85)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchCollaboratorUsage).mockResolvedValue({
      hasHigherPlan: true,
      isReadOnly: false,
      limit: 5,
      used: 2,
    });
    vi.mocked(fetchCollaboratorListPage).mockResolvedValue({
      items: [ACTIVE_COLLABORATOR],
      nextCursor: null,
      totalCount: 1,
    });
    vi.mocked(fetchCollaboratorDetail).mockResolvedValue({
      businessId: SUBSCRIBER_SESSION.businessId,
      email: ACTIVE_COLLABORATOR.email,
      fullName: ACTIVE_COLLABORATOR.fullName,
      id: ACTIVE_COLLABORATOR.id,
      lastEmailSentAt: null,
      permissions: ACTIVE_COLLABORATOR.permissions,
      phone: ACTIVE_COLLABORATOR.phone,
      serviceIds: ACTIVE_COLLABORATOR.serviceIds,
      services: [{ id: "service-1", name: "Corte" }],
      specialty: ACTIVE_COLLABORATOR.specialty,
      status: ACTIVE_COLLABORATOR.status,
      upcomingBookingsByService: { "service-1": 2 },
      upcomingBookingsCount: 2,
      upcomingServiceIdsWithBookings: ["service-1"],
      updatedAt: "2026-11-01T10:00:00.000Z",
      userId: "user-1",
    });
    vi.mocked(fetchActiveServicesForCollaborator).mockResolvedValue([
      { id: "service-1", name: "Corte" },
    ]);
  });

  it("KAN-83: displays collaborator list, usage counter, filters, and handles clear filters on empty result", async () => {
    vi.mocked(fetchCollaboratorListPage)
      .mockResolvedValueOnce({
        items: [ACTIVE_COLLABORATOR],
        nextCursor: null,
        totalCount: 1,
      })
      .mockResolvedValue({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });

    renderRoutesWithProviders(listRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorListPage();

    expect(await page.findText("Ana Perez")).toBeInTheDocument();
    expect(await page.findUsageCounter(2, 5)).toBeInTheDocument();

    await page.typeSearch("Inexistente");
    expect(await page.findEmptyState(true)).toBeInTheDocument();

    vi.mocked(fetchCollaboratorListPage).mockResolvedValueOnce({
      items: [ACTIVE_COLLABORATOR],
      nextCursor: null,
      totalCount: 1,
    });
    await page.clickClearFilters();
    expect(await page.findText("Ana Perez")).toBeInTheDocument();
  });

  it("KAN-83: renders error state and retries loading when retry is clicked", async () => {
    vi.mocked(fetchCollaboratorListPage)
      .mockRejectedValueOnce(new Error("Network failure"))
      .mockResolvedValueOnce({
        items: [ACTIVE_COLLABORATOR],
        nextCursor: null,
        totalCount: 1,
      });

    renderRoutesWithProviders(listRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorListPage();

    await page.clickRetry();
    expect(await page.findText("Ana Perez")).toBeInTheDocument();
  });

  it("KAN-85: opens limit modal with upgrade action when quota reached and higher plan exists", async () => {
    vi.mocked(fetchCollaboratorUsage).mockResolvedValue({
      hasHigherPlan: true,
      isReadOnly: false,
      limit: 2,
      used: 2,
    });

    renderRoutesWithProviders(listRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorListPage();

    await page.clickAddCollaborator();
    expect(await page.findLimitDialogHeading()).toBeInTheDocument();

    await page.clickUpgradePlan();
    expect(await screen.findByText("Upgrade Plans Route")).toBeInTheDocument();
  });

  it("KAN-85: opens limit modal without upgrade action when already on highest plan", async () => {
    vi.mocked(fetchCollaboratorUsage).mockResolvedValue({
      hasHigherPlan: false,
      isReadOnly: false,
      limit: 10,
      used: 10,
    });

    renderRoutesWithProviders(listRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorListPage();

    await page.clickAddCollaborator();
    expect(await page.findNoHigherPlanNotice()).toBeInTheDocument();
    expect(page.queryUpgradeButton()).not.toBeInTheDocument();
  });

  it("KAN-85: shows read-only warning and hides mutation controls when business is read-only", async () => {
    vi.mocked(fetchCollaboratorUsage).mockResolvedValue({
      hasHigherPlan: false,
      isReadOnly: true,
      limit: 5,
      used: 1,
    });

    renderRoutesWithProviders(listRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorListPage();

    expect(await page.findReadOnlyAlert()).toBeInTheDocument();
    expect(page.queryAddButton()).not.toBeInTheDocument();
  });

  it("KAN-81: deactivates active collaborator after confirming upcoming bookings warning", async () => {
    vi.mocked(collaboratorClient.updateCollaboratorStatus).mockResolvedValue({
      collaboratorId: ACTIVE_COLLABORATOR.id,
      status: COLLABORATOR_STATUS.INACTIVE,
    });

    renderRoutesWithProviders(listRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorListPage();

    await page.clickDeactivateRowAction();
    expect(
      await page.findText(
        testI18n.t("business:collaborators.deactivate.confirmWithBookings", {
          count: 2,
          name: ACTIVE_COLLABORATOR.fullName,
        }),
      ),
    ).toBeInTheDocument();
    await page.clickConfirmDeactivate();

    await waitFor(() => {
      expect(collaboratorClient.updateCollaboratorStatus).toHaveBeenCalledWith({
        businessId: SUBSCRIBER_SESSION.businessId,
        collaboratorId: ACTIVE_COLLABORATOR.id,
        targetStatus: COLLABORATOR_STATUS.INACTIVE,
      });
    });
  });

  it("KAN-82 & KAN-85: opens limit modal when reactivating an inactive collaborator exceeds plan limit", async () => {
    vi.mocked(fetchCollaboratorListPage).mockResolvedValue({
      items: [INACTIVE_COLLABORATOR],
      nextCursor: null,
      totalCount: 1,
    });
    const limitError = new FirebaseError(
      FIREBASE_ERROR_CODE.FUNCTIONS_RESOURCE_EXHAUSTED,
      "Limit reached",
    ) as FirebaseError & { details?: Record<string, unknown> };
    limitError.details = {
      hasHigherPlan: true,
      limit: 5,
      reason: COLLABORATOR_ERROR_REASON.LIMIT_REACHED,
    };
    vi.mocked(
      collaboratorClient.updateCollaboratorStatus,
    ).mockRejectedValueOnce(limitError);

    renderRoutesWithProviders(listRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorListPage();

    await page.clickReactivateRowAction();
    await page.clickConfirmReactivate();

    expect(await page.findLimitDialogHeading()).toBeInTheDocument();
  });

  it("KAN-84: resends invitation email from row action for invited collaborator", async () => {
    vi.mocked(fetchCollaboratorListPage).mockResolvedValue({
      items: [INVITED_COLLABORATOR],
      nextCursor: null,
      totalCount: 1,
    });
    vi.mocked(collaboratorClient.resendCollaboratorEmail).mockResolvedValue({
      collaboratorId: INVITED_COLLABORATOR.id,
      kind: "invitation",
    });

    renderRoutesWithProviders(listRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorListPage();

    await page.clickResendInvitedRowAction();

    await waitFor(() => {
      expect(collaboratorClient.resendCollaboratorEmail).toHaveBeenCalledWith({
        businessId: SUBSCRIBER_SESSION.businessId,
        collaboratorId: INVITED_COLLABORATOR.id,
      });
    });
  });
});
