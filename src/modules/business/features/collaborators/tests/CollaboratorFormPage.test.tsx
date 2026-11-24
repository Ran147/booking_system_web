import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import type { RouteObject } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FIREBASE_ERROR_CODE, ROUTE_PATH } from "@/constants";
import { COLLABORATOR_PERMISSION, COLLABORATOR_STATUS } from "@/domain";
import { renderRoutesWithProviders } from "@/shared/test-utils/renderRoutesWithProviders";
import { SUBSCRIBER_SESSION } from "@/shared/test-utils/sessionFixtures";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createCollaboratorFormPage } from "./CollaboratorFormPage.page";
import * as collaboratorClient from "../api/collaboratorClient";
import { fetchActiveServicesForCollaborator } from "../api/fetchActiveServicesForCollaborator";
import { fetchCollaboratorDetail } from "../api/fetchCollaboratorDetail";
import { fetchCollaboratorUsage } from "../api/fetchCollaboratorUsage";
import { COLLABORATOR_ERROR_REASON } from "../constants/CollaboratorFeature.constants";
import { CollaboratorFormPage } from "../pages/CollaboratorFormPage";

vi.mock("../api/fetchActiveServicesForCollaborator", () => ({
  fetchActiveServicesForCollaborator: vi.fn(),
}));

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
    registerCollaborator: vi.fn(),
    updateCollaborator: vi.fn(),
  };
});

const formRoutes: RouteObject[] = [
  {
    element: <div>Collaborators List Route</div>,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
  },
  {
    element: <div>Collaborator Detail Route</div>,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_DETAIL}`,
  },
  {
    element: <CollaboratorFormPage />,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_NEW}`,
  },
  {
    element: <CollaboratorFormPage />,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_EDIT}`,
  },
  {
    element: <div>Services Route</div>,
    path: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SERVICES}`,
  },
  {
    element: <div>Plans Route</div>,
    path: ROUTE_PATH.LANDING.PLANS,
  },
];

describe("CollaboratorFormPage (KAN-78, KAN-80, KAN-85)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchCollaboratorUsage).mockResolvedValue({
      hasHigherPlan: true,
      isReadOnly: false,
      limit: 5,
      used: 1,
    });
    vi.mocked(fetchActiveServicesForCollaborator).mockResolvedValue([
      { id: "service-1", name: "Corte clasico" },
      { id: "service-2", name: "Barba" },
    ]);
  });

  it("KAN-78: shows alert and redirects to Services when business has no active services", async () => {
    vi.mocked(fetchActiveServicesForCollaborator).mockResolvedValue([]);

    renderRoutesWithProviders(formRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_NEW}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorFormPage();

    expect(await page.findNoActiveServicesAlert()).toBeInTheDocument();
    await page.clickGoToServices();
    expect(await screen.findByText("Services Route")).toBeInTheDocument();
  });

  it("KAN-78: registers a new collaborator with selected services and permissions", async () => {
    vi.mocked(collaboratorClient.registerCollaborator).mockResolvedValue({
      collaboratorId: "new-collab",
      email: "camila@salon.com",
      invitationToken: "invite-token-new",
      status: COLLABORATOR_STATUS.INVITED,
    });

    renderRoutesWithProviders(formRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_NEW}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorFormPage();

    await page.typeFullName("Camila Solano");
    await page.typeEmail("camila@salon.com");
    await page.typePhone("+50688881111");
    await page.typeSpecialty("Estilista");
    await page.toggleCheckboxByLabel("Corte clasico");
    await page.toggleCheckboxByLabel(
      testI18n.t(
        `business:collaborators.permissions.items.${COLLABORATOR_PERMISSION.MANAGE_BOOKINGS}.label`,
      ),
    );
    await page.clickSubmitCreate();

    await waitFor(() => {
      expect(collaboratorClient.registerCollaborator).toHaveBeenCalledWith({
        businessId: SUBSCRIBER_SESSION.businessId,
        email: "camila@salon.com",
        fullName: "Camila Solano",
        permissions: [COLLABORATOR_PERMISSION.MANAGE_BOOKINGS],
        phone: "+50688881111",
        serviceIds: ["service-1"],
        specialty: "Estilista",
      });
    });

    const linkInput = (await screen.findByLabelText(
      testI18n.t("business:collaborators.invitationLink.linkLabel"),
    )) as HTMLInputElement;
    expect(linkInput.value).toContain(
      `${ROUTE_PATH.AUTH.ACCEPT_INVITATION}?token=invite-token-new`,
    );

    const closeInvitationButton = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.invitationLink.closeAction"),
    });
    await userEvent.setup().click(closeInvitationButton);

    expect(
      await screen.findByText("Collaborators List Route"),
    ).toBeInTheDocument();
  });

  it("KAN-78: shows emailInUse error banner when registration returns already-exists", async () => {
    vi.mocked(collaboratorClient.registerCollaborator).mockRejectedValueOnce(
      new FirebaseError(
        FIREBASE_ERROR_CODE.FUNCTIONS_ALREADY_EXISTS,
        "Email already in use",
      ),
    );

    renderRoutesWithProviders(formRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_NEW}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorFormPage();

    await page.typeFullName("Camila Solano");
    await page.typeEmail("dup@salon.com");
    await page.typePhone("+50688881111");
    await page.toggleCheckboxByLabel("Corte clasico");
    await page.clickSubmitCreate();

    expect(
      await page.findText(
        testI18n.t("business:collaborators.create.emailInUse"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-85: opens limit modal when server rejects registration due to plan limit", async () => {
    const limitError = new FirebaseError(
      FIREBASE_ERROR_CODE.FUNCTIONS_RESOURCE_EXHAUSTED,
      "Max collaborators reached",
    ) as FirebaseError & { details?: Record<string, unknown> };
    limitError.details = {
      hasHigherPlan: true,
      limit: 3,
      reason: COLLABORATOR_ERROR_REASON.LIMIT_REACHED,
    };
    vi.mocked(collaboratorClient.registerCollaborator).mockRejectedValueOnce(
      limitError,
    );

    renderRoutesWithProviders(formRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_NEW}`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorFormPage();

    await page.typeFullName("Camila Solano");
    await page.typeEmail("camila@salon.com");
    await page.typePhone("+50688881111");
    await page.toggleCheckboxByLabel("Corte clasico");
    await page.clickSubmitCreate();

    expect(
      await page.findText(testI18n.t("business:collaborators.limit.title")),
    ).toBeInTheDocument();
  });

  it("KAN-80: locks email for active collaborator and displays concurrent modification error", async () => {
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
      upcomingBookingsByService: { "service-1": 2 },
      upcomingBookingsCount: 2,
      upcomingServiceIdsWithBookings: ["service-1"],
      updatedAt: "2026-11-01T10:00:00.000Z",
      userId: "user-1",
    });

    const abortedError = new FirebaseError(
      FIREBASE_ERROR_CODE.FUNCTIONS_ABORTED,
      "Concurrent update",
    ) as FirebaseError & { details?: Record<string, unknown> };
    abortedError.details = {
      reason: COLLABORATOR_ERROR_REASON.CONCURRENT_MODIFICATION,
    };
    vi.mocked(collaboratorClient.updateCollaborator).mockRejectedValueOnce(
      abortedError,
    );

    renderRoutesWithProviders(formRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/collaborators/collab-1/edit`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorFormPage();

    const emailInput = await page.findEmailInput();
    expect(emailInput).toBeDisabled();
    expect(
      await page.findText(
        testI18n.t("business:collaborators.edit.emailLockedHint"),
      ),
    ).toBeInTheDocument();

    await page.toggleCheckboxByLabel("Barba");
    await page.clickSubmitEdit();

    expect(
      await page.findText(
        testI18n.t("business:collaborators.edit.concurrentError"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-80: allows changing email for invited collaborator and warns when removing service with upcoming bookings", async () => {
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
      upcomingBookingsByService: { "service-1": 3 },
      upcomingBookingsCount: 3,
      upcomingServiceIdsWithBookings: ["service-1"],
      updatedAt: "2026-11-01T10:00:00.000Z",
      userId: null,
    });
    vi.mocked(collaboratorClient.updateCollaborator).mockResolvedValue({
      collaboratorId: "collab-2",
      emailChanged: true,
      invitationToken: "invite-token-edited",
      upcomingAffectedBookingsCount: 3,
    });

    renderRoutesWithProviders(formRoutes, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/collaborators/collab-2/edit`,
      session: SUBSCRIBER_SESSION,
    });
    const page = createCollaboratorFormPage();

    const emailInput = await page.findEmailInput();
    expect(emailInput).toBeEnabled();

    await page.typeEmail("luis.nuevo@salon.com");
    await page.toggleCheckboxByLabel("Barba");
    await page.toggleCheckboxByLabel("Corte clasico");

    expect(
      await page.findText(
        testI18n.t("business:collaborators.edit.serviceHasBookingsWarning", {
          count: 3,
        }),
      ),
    ).toBeInTheDocument();

    await page.clickSubmitEdit();

    await waitFor(() => {
      expect(collaboratorClient.updateCollaborator).toHaveBeenCalledWith(
        expect.objectContaining({
          collaboratorId: "collab-2",
          email: "luis.nuevo@salon.com",
          serviceIds: ["service-2"],
        }),
      );
    });

    const linkInput = (await screen.findByLabelText(
      testI18n.t("business:collaborators.invitationLink.linkLabel"),
    )) as HTMLInputElement;
    expect(linkInput.value).toContain(
      `${ROUTE_PATH.AUTH.ACCEPT_INVITATION}?token=invite-token-edited`,
    );
  });
});
