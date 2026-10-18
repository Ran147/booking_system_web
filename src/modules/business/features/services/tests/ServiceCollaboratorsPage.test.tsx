import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/common";
import { BUSINESS_STATUS, USER_ROLE } from "@/domain";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import { SUBSCRIBER_SESSION } from "@/test-utils/sessionFixtures";
import {
  createServiceCollaboratorsPageObject,
  type ServiceCollaboratorsPageObject,
} from "./ServiceCollaboratorsPage.page";
import * as fetchBusinessStatusModule from "../api/fetchBusinessStatus";
import * as fetchServiceCollaboratorsDataModule from "../api/fetchServiceCollaboratorsData";
import * as updateServiceCollaboratorsModule from "../api/updateServiceCollaborators";
import { ServiceCollaboratorsPage } from "../components/ServiceCollaboratorsPage";
import { COLLABORATOR_SELECTION_MODE } from "../constants/ServiceCollaborators.constants";
import type { ServiceCollaboratorsData } from "../models/ServiceCollaborators.interface";

vi.mock("@/components/common", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@/components/common",
  );
  return {
    ...actual,
    toast: {
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

const TEST_SERVICE_ID = "service-123";

const MOCK_COLLABORATORS_DATA: ServiceCollaboratorsData = {
  collaborators: [
    {
      email: "ana@barber.com",
      fullName: "Ana Barber",
      id: "collab-1",
      isAssigned: true,
      pendingOrConfirmedBookingsCount: 3,
      status: "active",
    },
    {
      email: "carlos@barber.com",
      fullName: "Carlos Stylist",
      id: "collab-2",
      isAssigned: false,
      pendingOrConfirmedBookingsCount: 0,
      status: "active",
    },
  ],
  currentSelectionMode: COLLABORATOR_SELECTION_MODE.CUSTOMER_CHOICE,
  serviceName: "Corte Clásico",
};

interface SetupTestResult {
  readonly page: ServiceCollaboratorsPageObject;
  readonly renderResult: ReturnType<typeof renderWithProviders>;
}

describe("ServiceCollaboratorsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(
      fetchBusinessStatusModule,
      "fetchBusinessStatus",
    ).mockResolvedValue(BUSINESS_STATUS.ACTIVE);
    vi.spyOn(
      fetchServiceCollaboratorsDataModule,
      "fetchServiceCollaboratorsData",
    ).mockResolvedValue(MOCK_COLLABORATORS_DATA);
    vi.spyOn(
      updateServiceCollaboratorsModule,
      "updateServiceCollaborators",
    ).mockResolvedValue({
      updatedServiceId: TEST_SERVICE_ID,
    });
  });

  const setupTest = (
    options: {
      businessStatus?:
        typeof BUSINESS_STATUS.ACTIVE | typeof BUSINESS_STATUS.INACTIVE;
      initialData?: ServiceCollaboratorsData;
      onNavigate?: (path: string) => void;
      userPermissions?: string[];
      userRole?: typeof USER_ROLE.SUBSCRIBER | typeof USER_ROLE.COLLABORATOR;
    } = {},
  ): SetupTestResult => {
    const page = createServiceCollaboratorsPageObject();
    const renderResult = renderWithProviders(
      <ServiceCollaboratorsPage
        businessStatus={options.businessStatus}
        initialData={options.initialData ?? MOCK_COLLABORATORS_DATA}
        onNavigate={options.onNavigate}
        serviceId={TEST_SERVICE_ID}
        userPermissions={options.userPermissions}
        userRole={options.userRole}
      />,
      {
        initialPath: `/business/services/${TEST_SERVICE_ID}/collaborators`,
        session: SUBSCRIBER_SESSION,
      },
    );

    return { page, renderResult };
  };

  it("AC-KAN-61-01: renders collaborators and saves updated assignments", async () => {
    const { page } = setupTest();

    // Verify initial states
    expect(page.getCollaboratorCheckbox("collab-1")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(page.getCollaboratorCheckbox("collab-2")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    // Toggle collab-2 to assign them as well
    await page.toggleCollaborator("collab-2");
    expect(page.getCollaboratorCheckbox("collab-2")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.clickSave();

    await waitFor(() => {
      expect(
        updateServiceCollaboratorsModule.updateServiceCollaborators,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: SUBSCRIBER_SESSION.businessId,
          collaboratorIds: ["collab-1", "collab-2"],
          serviceId: TEST_SERVICE_ID,
        }),
      );
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("AC-KAN-61-02: chooses automatic selection mode and saves", async () => {
    const { page } = setupTest();

    expect(
      page.getModeButton(COLLABORATOR_SELECTION_MODE.CUSTOMER_CHOICE),
    ).toHaveAttribute("aria-checked", "true");

    await page.selectMode(COLLABORATOR_SELECTION_MODE.AUTOMATIC);
    expect(
      page.getModeButton(COLLABORATOR_SELECTION_MODE.AUTOMATIC),
    ).toHaveAttribute("aria-checked", "true");

    await page.clickSave();

    await waitFor(() => {
      expect(
        updateServiceCollaboratorsModule.updateServiceCollaborators,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          collaboratorSelection: COLLABORATOR_SELECTION_MODE.AUTOMATIC,
        }),
      );
    });
  });

  it("AC-KAN-61-03: hides selection mode when 0 collaborators are selected", async () => {
    const { page } = setupTest();

    expect(page.isSelectionModeVisible()).toBe(true);
    expect(page.isNoCollaboratorNoticeVisible()).toBe(false);

    // Unselect collab-1 so 0 collaborators remain
    await page.toggleCollaborator("collab-1");

    expect(page.isSelectionModeVisible()).toBe(false);
    expect(page.isNoCollaboratorNoticeVisible()).toBe(true);

    await page.clickSave();

    await waitFor(() => {
      expect(
        updateServiceCollaboratorsModule.updateServiceCollaborators,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          collaboratorIds: [],
          collaboratorSelection: null,
        }),
      );
    });
  });

  it("AC-KAN-61-04: warns when unassigning a collaborator with future bookings", async () => {
    const { page } = setupTest();

    // collab-1 has 3 bookings, initially checked
    // Unchecking collab-1 shows the warning
    await page.toggleCollaborator("collab-1");

    expect(page.getCollaboratorWarningElement("collab-1")).toBeInTheDocument();
    expect(page.getCollaboratorWarningElement("collab-1")).toHaveTextContent(
      "3",
    );

    // Re-checking hides the warning
    await page.toggleCollaborator("collab-1");
    expect(page.getCollaboratorWarningElement("collab-1")).toBeNull();
  });

  it("AC-KAN-61-05: disables editing and warns when business is inactive", async () => {
    const { page } = setupTest({
      businessStatus: BUSINESS_STATUS.INACTIVE,
    });

    expect(page.isReadOnlyNoticeVisible()).toBe(true);
    expect(page.isSaveDisabled()).toBe(true);

    // Toggling is ignored in read-only mode
    await page.toggleCollaborator("collab-2");
    expect(page.getCollaboratorCheckbox("collab-2")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("AC-KAN-61-06: shows network error when save fails", async () => {
    vi.spyOn(
      updateServiceCollaboratorsModule,
      "updateServiceCollaborators",
    ).mockRejectedValueOnce(new Error("Network connection lost"));

    const { page } = setupTest();

    await page.clickSave();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("AC-KAN-61-07: redirects collaborator without manage_services to business portal home", async () => {
    const onNavigate = vi.fn();

    setupTest({
      onNavigate,
      userPermissions: ["manage_bookings"], // lacks manage_services
      userRole: USER_ROLE.COLLABORATOR,
    });

    expect(onNavigate).toHaveBeenCalledWith("/business");
  });
});
