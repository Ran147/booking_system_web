import { screen, waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import type { RouteObject } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FIREBASE_ERROR_CODE, ROUTE_PATH } from "@/constants";
import { COLLABORATOR_PERMISSION, COLLABORATOR_STATUS } from "@/domain";
import { renderRoutesWithProviders } from "@/shared/test-utils/renderRoutesWithProviders";
import { SUBSCRIBER_SESSION } from "@/shared/test-utils/sessionFixtures";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createCollaboratorProfilePage } from "./CollaboratorProfilePage.page";
import * as collaboratorClient from "../api/collaboratorClient";
import { fetchCollaboratorDetail } from "../api/fetchCollaboratorDetail";
import { fetchCollaboratorUsage } from "../api/fetchCollaboratorUsage";
import { COLLABORATOR_ERROR_REASON } from "../constants/CollaboratorFeature.constants";
import { CollaboratorProfilePage } from "../pages/CollaboratorProfilePage";

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
    resendCollaboratorEmail: vi.fn(),
    updateCollaboratorStatus: vi.fn(),
  };
});

const profileRoutes: RouteObject[] = [
  {
    element: <CollaboratorProfilePage />,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_DETAIL}`,
  },
  {
    element: <div>Collaborators List Route</div>,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
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

describe("CollaboratorProfilePage (KAN-81..KAN-85)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchCollaboratorUsage).mockResolvedValue({
      hasHigherPlan: true,
      isReadOnly: false,
      limit: 5,
      used: 2,
    });
  });

  it("KAN-83: renders full collaborator detail with services and permissions", async () => {
    vi.mocked(fetchCollaboratorDetail).mockResolvedValue({
      businessId: SUBSCRIBER_SESSION.businessId,
      email: "ana@salon.com",
      fullName: "Ana Perez",
      id: "collab-1",
      lastEmailSentAt: null,
      permissions: [COLLABORATOR_PERMISSION.MANAGE_BOOKINGS],
      phone: "+50688887777",
      serviceIds: ["service-1"],
      services: [{ id: "service-1", name: "Corte clasico" }],
      specialty: "Colorista",
      status: COLLABORATOR_STATUS.ACTIVE,
      upcomingBookingsByService: { "service-1": 1 },
      upcomingBookingsCount: 1,
      upcomingServiceIdsWithBookings: ["service-1"],
      updatedAt: "2026-11-01T10:00:00.000Z",
      userId: "user-1",
    });

    renderRoutesWithProviders(profileRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/collaborators/collab-1`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorProfilePage();

    expect(await page.findText("ana@salon.com")).toBeInTheDocument();
    expect(await page.findText("+50688887777")).toBeInTheDocument();
    expect(await page.findText("Corte clasico")).toBeInTheDocument();
    expect(
      await page.findText(
        testI18n.t("business:collaborators.profile.neverSent"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-83: displays notFound alert when collaborator does not exist", async () => {
    vi.mocked(fetchCollaboratorDetail).mockResolvedValue(null);

    renderRoutesWithProviders(profileRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/collaborators/missing`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorProfilePage();

    expect(await page.findNotFoundAlert()).toBeInTheDocument();
  });

  it("KAN-81: deactivates active collaborator with booking warning", async () => {
    vi.mocked(fetchCollaboratorDetail).mockResolvedValue({
      businessId: SUBSCRIBER_SESSION.businessId,
      email: "ana@salon.com",
      fullName: "Ana Perez",
      id: "collab-1",
      lastEmailSentAt: "2026-11-02T10:00:00.000Z",
      permissions: [],
      phone: "+50688887777",
      serviceIds: ["service-1"],
      services: [{ id: "service-1", name: "Corte clasico" }],
      specialty: null,
      status: COLLABORATOR_STATUS.ACTIVE,
      upcomingBookingsByService: { "service-1": 2 },
      upcomingBookingsCount: 2,
      upcomingServiceIdsWithBookings: ["service-1"],
      updatedAt: "2026-11-02T10:00:00.000Z",
      userId: "user-1",
    });
    vi.mocked(collaboratorClient.updateCollaboratorStatus).mockResolvedValue({
      collaboratorId: "collab-1",
      status: COLLABORATOR_STATUS.INACTIVE,
    });

    renderRoutesWithProviders(profileRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/collaborators/collab-1`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorProfilePage();

    await page.clickDeactivate();
    await page.clickConfirmDeactivate();

    await waitFor(() => {
      expect(collaboratorClient.updateCollaboratorStatus).toHaveBeenCalledWith({
        businessId: SUBSCRIBER_SESSION.businessId,
        collaboratorId: "collab-1",
        targetStatus: COLLABORATOR_STATUS.INACTIVE,
      });
    });
  });

  it("KAN-82 & KAN-85: opens limit modal if reactivating inactive collaborator exceeds plan limit", async () => {
    vi.mocked(fetchCollaboratorDetail).mockResolvedValue({
      businessId: SUBSCRIBER_SESSION.businessId,
      email: "sofia@salon.com",
      fullName: "Sofia Rojas",
      id: "collab-3",
      lastEmailSentAt: null,
      permissions: [],
      phone: "+50688885555",
      serviceIds: ["service-1"],
      services: [],
      specialty: null,
      status: COLLABORATOR_STATUS.INACTIVE,
      upcomingBookingsByService: {},
      upcomingBookingsCount: 0,
      upcomingServiceIdsWithBookings: [],
      updatedAt: "2026-11-01T10:00:00.000Z",
      userId: null,
    });
    const limitError = new FirebaseError(
      FIREBASE_ERROR_CODE.FUNCTIONS_RESOURCE_EXHAUSTED,
      "Limit reached",
    ) as FirebaseError & { details?: Record<string, unknown> };
    limitError.details = {
      hasHigherPlan: true,
      limit: 2,
      reason: COLLABORATOR_ERROR_REASON.LIMIT_REACHED,
    };
    vi.mocked(
      collaboratorClient.updateCollaboratorStatus,
    ).mockRejectedValueOnce(limitError);

    renderRoutesWithProviders(profileRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/collaborators/collab-3`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorProfilePage();

    await page.clickReactivate();
    await page.clickConfirmReactivate();

    expect(
      await page.findText(testI18n.t("business:collaborators.limit.title")),
    ).toBeInTheDocument();
  });

  it("KAN-84: resends invitation email and disables button with cooldown counter", async () => {
    vi.mocked(fetchCollaboratorDetail).mockResolvedValue({
      businessId: SUBSCRIBER_SESSION.businessId,
      email: "luis@salon.com",
      fullName: "Luis Mora",
      id: "collab-2",
      lastEmailSentAt: null,
      permissions: [],
      phone: "+50688886666",
      serviceIds: ["service-1"],
      services: [{ id: "service-1", name: "Corte clasico" }],
      specialty: null,
      status: COLLABORATOR_STATUS.INVITED,
      upcomingBookingsByService: {},
      upcomingBookingsCount: 0,
      upcomingServiceIdsWithBookings: [],
      updatedAt: "2026-11-01T10:00:00.000Z",
      userId: null,
    });
    vi.mocked(collaboratorClient.resendCollaboratorEmail).mockResolvedValue({
      collaboratorId: "collab-2",
      invitationToken: "profile-invite-token",
      kind: "invitation",
    });

    renderRoutesWithProviders(profileRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/collaborators/collab-2`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorProfilePage();

    await page.clickResendInvited();

    const linkInput = (await screen.findByLabelText(
      testI18n.t("business:collaborators.invitationLink.linkLabel"),
    )) as HTMLInputElement;
    expect(linkInput.value).toContain(
      `${ROUTE_PATH.AUTH.ACCEPT_INVITATION}?token=profile-invite-token`,
    );

    const cooldownButton = await page.findCooldownButton(60);
    expect(cooldownButton).toBeDisabled();
  });
});
