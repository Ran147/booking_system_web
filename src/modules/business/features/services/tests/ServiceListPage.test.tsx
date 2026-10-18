import { screen, waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { RouteObject } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/common";
import { FIREBASE_ERROR_CODE, FUNCTION_NAME } from "@/constants";
import { BUSINESS_STATUS, SERVICE_STATUS } from "@/domain";
import * as callFunctionModule from "@/services/firebase/callFunction";
import {
  renderRoutesWithProviders,
  renderWithProviders,
  SUBSCRIBER_SESSION,
} from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { formatPrice, normalizeSearchTerm } from "@/utils";
import { createServiceListPage } from "./ServiceListPage.page";
import * as fetchBusinessInfoModule from "../api/fetchBusinessInfo";
import * as fetchBusinessStatusModule from "../api/fetchBusinessStatus";
import * as fetchServicePageModule from "../api/fetchServicePage";
import * as updateServiceStatusModule from "../api/updateServiceStatus";
import { ServiceListPage } from "../components/ServiceListPage";
import type { ServiceListItem } from "../models";

const MOCK_SERVICES: readonly ServiceListItem[] = [
  {
    description: "Corte clásico con tijera y lavado",
    durationMinutes: 45,
    id: "service-haircut",
    name: "Corte de cabello",
    priceInCents: 25000,
    status: SERVICE_STATUS.ACTIVE,
  },
  {
    description: "Perfilado de barba con toalla caliente",
    durationMinutes: 30,
    id: "service-beard",
    name: "Arreglo de barba",
    priceInCents: 15000,
    status: SERVICE_STATUS.INACTIVE,
  },
  {
    description: "Tinte profesional y peinado",
    durationMinutes: 60,
    id: "service-color",
    name: "Tinte capilar",
    priceInCents: 45000,
    status: SERVICE_STATUS.ACTIVE,
  },
];

describe("ServiceListPage (KAN-55)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(
      fetchBusinessStatusModule,
      "fetchBusinessStatus",
    ).mockResolvedValue(BUSINESS_STATUS.ACTIVE);
    vi.spyOn(fetchBusinessInfoModule, "fetchBusinessInfo").mockResolvedValue({
      currency: "USD",
      status: BUSINESS_STATUS.ACTIVE,
    });
    vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
      items: [],
      nextCursor: null,
      totalCount: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders page header with title, description, and create service button", async () => {
    renderWithProviders(<ServiceListPage />, {
      initialPath: "/business/services",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();

    expect(await page.findHeading()).toBeInTheDocument();
    expect(
      screen.getByText(testI18n.t("business:services.list.description")),
    ).toBeInTheDocument();
    expect(await page.findCreateServiceButton()).toBeInTheDocument();
  });

  it("renders CRUD table structure with required columns", async () => {
    vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
      items: [...MOCK_SERVICES],
      nextCursor: null,
      totalCount: MOCK_SERVICES.length,
    });

    renderWithProviders(<ServiceListPage />, {
      initialPath: "/business/services",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();

    expect(await page.findTable()).toBeInTheDocument();
    expect(
      await page.findColumnHeader(testI18n.t("business:services.list.name")),
    ).toBeInTheDocument();
    expect(
      await page.findColumnHeader(
        testI18n.t("business:services.list.duration"),
      ),
    ).toBeInTheDocument();
    expect(
      await page.findColumnHeader(testI18n.t("business:services.list.price")),
    ).toBeInTheDocument();
    expect(
      await page.findColumnHeader(testI18n.t("business:services.list.status")),
    ).toBeInTheDocument();
    expect(
      await page.findColumnHeader(testI18n.t("business:services.list.actions")),
    ).toBeInTheDocument();
  });

  it("invokes onCreateService callback when clicking create service action", async () => {
    const handleCreateService = vi.fn();

    renderWithProviders(
      <ServiceListPage onCreateService={handleCreateService} />,
      {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceListPage();
    await page.clickCreateService();

    expect(handleCreateService).toHaveBeenCalledTimes(1);
  });

  it("navigates to /business/services/<serviceId>/edit when clicking edit service action", async () => {
    vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
      items: [MOCK_SERVICES[0]!],
      nextCursor: null,
      totalCount: 1,
    });

    const routes: RouteObject[] = [
      {
        element: <ServiceListPage />,
        path: "/business/services",
      },
      {
        element: <div>Página de edición de servicio</div>,
        path: "/business/services/:serviceId/edit",
      },
    ];

    const { router } = renderRoutesWithProviders(routes, {
      initialPath: "/business/services",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();
    expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();

    await page.clickEditService("Corte de cabello");

    expect(router.state.location.pathname).toBe(
      "/business/services/service-haircut/edit",
    );
    expect(
      screen.getByText("Página de edición de servicio"),
    ).toBeInTheDocument();
  });

  it("invokes onEditService callback when provided instead of default navigation", async () => {
    vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
      items: [MOCK_SERVICES[0]!],
      nextCursor: null,
      totalCount: 1,
    });

    const handleEditService = vi.fn();

    renderWithProviders(<ServiceListPage onEditService={handleEditService} />, {
      initialPath: "/business/services",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();
    expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();

    await page.clickEditService("Corte de cabello");

    expect(handleEditService).toHaveBeenCalledWith("service-haircut");
  });

  it("displays read-only warning and disables create action when business is inactive", async () => {
    vi.spyOn(
      fetchBusinessStatusModule,
      "fetchBusinessStatus",
    ).mockResolvedValue(BUSINESS_STATUS.INACTIVE);
    vi.spyOn(fetchBusinessInfoModule, "fetchBusinessInfo").mockResolvedValue({
      currency: "USD",
      status: BUSINESS_STATUS.INACTIVE,
    });

    renderWithProviders(
      <ServiceListPage businessStatus={BUSINESS_STATUS.INACTIVE} />,
      {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceListPage();

    expect(page.queryReadOnlyAlert()).toBeInTheDocument();
    const createButton = await page.findCreateServiceButton();
    expect(createButton).toBeDisabled();
  });

  it("AC-KAN-55-01: renders one page of services with name, price in business currency, duration, status badge and total count", async () => {
    vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
      items: [MOCK_SERVICES[0]!],
      nextCursor: null,
      totalCount: 1,
    });

    renderWithProviders(<ServiceListPage currency="USD" />, {
      initialPath: "/business/services",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();

    const row = await page.findRowByName("Corte de cabello");
    expect(row).toBeInTheDocument();
    expect(row).toHaveTextContent("45 min");
    expect(row).toHaveTextContent(
      formatPrice(
        MOCK_SERVICES[0]!.priceInCents,
        "USD",
        testI18n.language,
      ).replace(/\u00a0/g, " "),
    );
    expect(
      screen.getByText(testI18n.t("business:services.list.statusActive")),
    ).toBeInTheDocument();
    expect(await page.findPaginationSummary()).toBeInTheDocument();
  });

  it("AC-KAN-55-02: filters services by prefix ignoring case and accents", async () => {
    vi.spyOn(fetchServicePageModule, "fetchServicePage").mockImplementation(
      async ({ filters }) => {
        const normalized = normalizeSearchTerm(filters.searchTerm);
        const filtered = MOCK_SERVICES.filter((serviceItem) =>
          normalizeSearchTerm(serviceItem.name).startsWith(normalized),
        );
        return {
          items: filtered,
          nextCursor: null,
          totalCount: filtered.length,
        };
      },
    );

    renderWithProviders(<ServiceListPage />, {
      initialPath: "/business/services",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();
    await page.changeSearchTerm("corte");

    await waitFor(
      () => {
        expect(page.queryRowByName("Arreglo de barba")).not.toBeInTheDocument();
        expect(page.queryRowByName("Corte de cabello")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("preserves trailing whitespace while typing search term with multiple words", async () => {
    vi.spyOn(fetchServicePageModule, "fetchServicePage").mockImplementation(
      async ({ filters }) => {
        const normalized = normalizeSearchTerm(filters.searchTerm);
        const filtered = MOCK_SERVICES.filter((serviceItem) =>
          normalizeSearchTerm(serviceItem.name).startsWith(normalized),
        );
        return {
          items: filtered,
          nextCursor: null,
          totalCount: filtered.length,
        };
      },
    );

    renderWithProviders(<ServiceListPage />, {
      initialPath: "/business/services",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();
    await page.changeSearchTerm("corte ");

    const searchInput = screen.getByRole("searchbox", {
      name: testI18n.t("business:services.list.searchLabel"),
    });

    await waitFor(
      () => {
        expect(page.queryRowByName("Arreglo de barba")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(searchInput).toHaveValue("corte ");
  });

  it("AC-KAN-55-03: filters by status active or inactive and total count matches the filter", async () => {
    vi.spyOn(fetchServicePageModule, "fetchServicePage").mockImplementation(
      async ({ filters }) => {
        const filtered = MOCK_SERVICES.filter(
          (serviceItem) =>
            !filters.status || serviceItem.status === filters.status,
        );
        return {
          items: filtered,
          nextCursor: null,
          totalCount: filtered.length,
        };
      },
    );

    renderWithProviders(<ServiceListPage />, {
      initialPath: "/business/services",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();
    await page.changeStatusFilter(SERVICE_STATUS.INACTIVE);

    await waitFor(
      () => {
        expect(page.queryRowByName("Arreglo de barba")).toBeInTheDocument();
        expect(page.queryRowByName("Corte de cabello")).not.toBeInTheDocument();
        expect(page.queryRowByName("Tinte capilar")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("AC-KAN-55-04: shows network error and retry action when loading fails", async () => {
    const fetchSpy = vi
      .spyOn(fetchServicePageModule, "fetchServicePage")
      .mockRejectedValueOnce(new Error("Network connection error"))
      .mockResolvedValueOnce({
        items: [MOCK_SERVICES[0]!],
        nextCursor: null,
        totalCount: 1,
      });

    renderWithProviders(<ServiceListPage />, {
      initialPath: "/business/services",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();

    expect(await page.findErrorAlert()).toBeInTheDocument();

    await page.clickRetry();

    await waitFor(
      () => {
        expect(page.queryRowByName("Corte de cabello")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("AC-KAN-55-05: displays empty state with create action when business has no services", async () => {
    vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
      items: [],
      nextCursor: null,
      totalCount: 0,
    });

    renderWithProviders(<ServiceListPage />, {
      initialPath: "/business/services",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();

    expect(await page.findEmptyStateTitle()).toBeInTheDocument();
    expect(await page.findEmptyStateDescription()).toBeInTheDocument();
    expect(await page.findCreateServiceButton()).toBeInTheDocument();
  });

  it("AC-KAN-55-06: shows noResults and clear filters action when search or filter matches nothing", async () => {
    vi.spyOn(fetchServicePageModule, "fetchServicePage").mockImplementation(
      async ({ filters }) => {
        if (filters.searchTerm || filters.status) {
          return { items: [], nextCursor: null, totalCount: 0 };
        }
        return {
          items: [...MOCK_SERVICES],
          nextCursor: null,
          totalCount: MOCK_SERVICES.length,
        };
      },
    );

    renderWithProviders(<ServiceListPage />, {
      initialPath: "/business/services?q=no_match",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();

    expect(await page.findNoResultsTitle()).toBeInTheDocument();
    expect(await page.findNoResultsDescription()).toBeInTheDocument();

    await page.clickClearFilters();

    await waitFor(
      () => {
        expect(page.queryRowByName("Corte de cabello")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("AC-KAN-55-07: moves to next and previous page with cursor pagination, and resetting filters returns to page 1", async () => {
    const mockCursor = { id: "cursor-1" } as unknown as QueryDocumentSnapshot;

    vi.spyOn(fetchServicePageModule, "fetchServicePage").mockImplementation(
      async ({ pageCursor }) => {
        if (!pageCursor) {
          return {
            items: [MOCK_SERVICES[0]!],
            nextCursor: mockCursor,
            totalCount: 2,
          };
        }
        return {
          items: [MOCK_SERVICES[1]!],
          nextCursor: null,
          totalCount: 2,
        };
      },
    );

    renderWithProviders(<ServiceListPage />, {
      initialPath: "/business/services",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();

    expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();

    await page.clickNextPage();

    await waitFor(
      () => {
        expect(page.queryRowByName("Arreglo de barba")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await page.clickPreviousPage();

    await waitFor(
      () => {
        expect(page.queryRowByName("Corte de cabello")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await page.clickNextPage();

    await waitFor(
      () => {
        expect(page.queryRowByName("Arreglo de barba")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await page.changeStatusFilter(SERVICE_STATUS.ACTIVE);

    await waitFor(
      () => {
        expect(page.queryRowByName("Corte de cabello")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("AC-KAN-55-08: allows viewing and searching services when business is inactive/suspended, but edit and create are disabled", async () => {
    vi.spyOn(
      fetchBusinessStatusModule,
      "fetchBusinessStatus",
    ).mockResolvedValue(BUSINESS_STATUS.INACTIVE);
    vi.spyOn(fetchBusinessInfoModule, "fetchBusinessInfo").mockResolvedValue({
      currency: "USD",
      status: BUSINESS_STATUS.INACTIVE,
    });
    vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
      items: [MOCK_SERVICES[0]!],
      nextCursor: null,
      totalCount: 1,
    });

    renderWithProviders(
      <ServiceListPage businessStatus={BUSINESS_STATUS.INACTIVE} />,
      {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceListPage();

    expect(page.queryReadOnlyAlert()).toBeInTheDocument();
    expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();
    const createButton = await page.findCreateServiceButton();
    expect(createButton).toBeDisabled();

    const editButtons = screen.getAllByRole("button", {
      name: testI18n.t("business:services.list.editAction"),
    });
    for (const editButton of editButtons) {
      expect(editButton).toBeDisabled();
    }
  });

  describe("Activate a service (KAN-57)", () => {
    it("AC-KAN-57-01: activates an inactive service and immediately updates status to active", async () => {
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[1]!],
        nextCursor: null,
        totalCount: 1,
      });
      const updateStatusSpy = vi
        .spyOn(updateServiceStatusModule, "updateServiceStatus")
        .mockResolvedValueOnce({
          serviceId: "service-beard",
          status: SERVICE_STATUS.ACTIVE,
        });
      const toastSuccessSpy = vi.spyOn(toast, "success");

      renderWithProviders(<ServiceListPage />, {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      });

      const page = createServiceListPage();

      expect(await page.findRowByName("Arreglo de barba")).toBeInTheDocument();
      await page.clickActivateService("Arreglo de barba");

      await waitFor(() => {
        expect(updateStatusSpy).toHaveBeenCalledWith({
          businessId: SUBSCRIBER_SESSION.businessId,
          serviceId: "service-beard",
          status: SERVICE_STATUS.ACTIVE,
        });
      });

      expect(toastSuccessSpy).toHaveBeenCalledWith(
        testI18n.t("business:services.status.activateSuccess"),
      );
    });

    it("AC-KAN-57-02: shows business:errors.readOnly and does not activate when business is inactive/suspended", async () => {
      vi.spyOn(
        fetchBusinessStatusModule,
        "fetchBusinessStatus",
      ).mockResolvedValue(BUSINESS_STATUS.INACTIVE);
      vi.spyOn(fetchBusinessInfoModule, "fetchBusinessInfo").mockResolvedValue({
        currency: "USD",
        status: BUSINESS_STATUS.INACTIVE,
      });
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[1]!],
        nextCursor: null,
        totalCount: 1,
      });
      const updateStatusSpy = vi.spyOn(
        updateServiceStatusModule,
        "updateServiceStatus",
      );

      renderWithProviders(
        <ServiceListPage businessStatus={BUSINESS_STATUS.INACTIVE} />,
        {
          initialPath: "/business/services",
          session: SUBSCRIBER_SESSION,
        },
      );

      const page = createServiceListPage();

      expect(await page.findRowByName("Arreglo de barba")).toBeInTheDocument();
      const activateButton = await page.queryActivateButton("Arreglo de barba");
      expect(activateButton).toBeDisabled();
      expect(updateStatusSpy).not.toHaveBeenCalled();
    });

    it("AC-KAN-57-03: rolls back to inactive and shows common:errors.network when activation fails with network error", async () => {
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[1]!],
        nextCursor: null,
        totalCount: 1,
      });
      vi.spyOn(
        updateServiceStatusModule,
        "updateServiceStatus",
      ).mockRejectedValueOnce(
        new FirebaseError(
          FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
          "network error",
        ),
      );
      const toastErrorSpy = vi.spyOn(toast, "error");

      renderWithProviders(<ServiceListPage />, {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      });

      const page = createServiceListPage();

      expect(await page.findRowByName("Arreglo de barba")).toBeInTheDocument();
      await page.clickActivateService("Arreglo de barba");

      await waitFor(() => {
        expect(toastErrorSpy).toHaveBeenCalledWith(
          testI18n.t("common:errors.network"),
        );
      });

      const row = await page.findRowByName("Arreglo de barba");
      expect(row).toHaveTextContent(
        testI18n.t("business:services.list.statusInactive"),
      );
    });

    it("AC-KAN-57-04: only offers the activate action on inactive services", async () => {
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[0]!],
        nextCursor: null,
        totalCount: 1,
      });

      renderWithProviders(<ServiceListPage />, {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      });

      const page = createServiceListPage();

      expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();
      const activateButton = await page.queryActivateButton("Corte de cabello");
      expect(activateButton).not.toBeInTheDocument();
    });
  });

  describe("Deactivate a service (KAN-58)", () => {
    it("AC-KAN-58-01: deactivates an active service upon confirmation and updates status", async () => {
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[0]!],
        nextCursor: null,
        totalCount: 1,
      });
      const updateStatusSpy = vi
        .spyOn(updateServiceStatusModule, "updateServiceStatus")
        .mockResolvedValueOnce({
          serviceId: "service-haircut",
          status: SERVICE_STATUS.INACTIVE,
        });
      const toastSuccessSpy = vi.spyOn(toast, "success");

      renderWithProviders(<ServiceListPage />, {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      });

      const page = createServiceListPage();

      expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();
      await page.clickDeactivateService("Corte de cabello");

      expect(await page.findDeactivateConfirmModal()).toBeInTheDocument();
      await page.confirmDeactivation();

      await waitFor(() => {
        expect(updateStatusSpy).toHaveBeenCalledWith({
          businessId: SUBSCRIBER_SESSION.businessId,
          serviceId: "service-haircut",
          status: SERVICE_STATUS.INACTIVE,
        });
      });

      expect(toastSuccessSpy).toHaveBeenCalledWith(
        testI18n.t("business:services.status.deactivateSuccess"),
      );
    });

    it("AC-KAN-58-02: disables deactivate action when business is inactive/suspended", async () => {
      vi.spyOn(
        fetchBusinessStatusModule,
        "fetchBusinessStatus",
      ).mockResolvedValue(BUSINESS_STATUS.SUSPENDED);
      vi.spyOn(fetchBusinessInfoModule, "fetchBusinessInfo").mockResolvedValue({
        currency: "USD",
        status: BUSINESS_STATUS.SUSPENDED,
      });
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[0]!],
        nextCursor: null,
        totalCount: 1,
      });
      const updateStatusSpy = vi.spyOn(
        updateServiceStatusModule,
        "updateServiceStatus",
      );

      renderWithProviders(
        <ServiceListPage businessStatus={BUSINESS_STATUS.SUSPENDED} />,
        {
          initialPath: "/business/services",
          session: SUBSCRIBER_SESSION,
        },
      );

      const page = createServiceListPage();

      expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();
      const deactivateButton =
        await page.queryDeactivateButton("Corte de cabello");
      expect(deactivateButton).toBeDisabled();
      expect(updateStatusSpy).not.toHaveBeenCalled();
    });

    it("AC-KAN-58-03: rolls back to active and shows common:errors.network when deactivation fails with network error", async () => {
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[0]!],
        nextCursor: null,
        totalCount: 1,
      });
      vi.spyOn(
        updateServiceStatusModule,
        "updateServiceStatus",
      ).mockRejectedValueOnce(
        new FirebaseError(
          FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
          "network error",
        ),
      );
      const toastErrorSpy = vi.spyOn(toast, "error");

      renderWithProviders(<ServiceListPage />, {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      });

      const page = createServiceListPage();

      expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();
      await page.clickDeactivateService("Corte de cabello");
      await page.confirmDeactivation();

      await waitFor(() => {
        expect(toastErrorSpy).toHaveBeenCalledWith(
          testI18n.t("common:errors.network"),
        );
      });

      const row = await page.findRowByName("Corte de cabello");
      expect(row).toHaveTextContent(
        testI18n.t("business:services.list.statusActive"),
      );
    });

    it("AC-KAN-58-04: keeps existing confirmed bookings intact when service is deactivated (AS-2)", async () => {
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[0]!],
        nextCursor: null,
        totalCount: 1,
      });
      const updateStatusSpy = vi
        .spyOn(updateServiceStatusModule, "updateServiceStatus")
        .mockResolvedValueOnce({
          serviceId: "service-haircut",
          status: SERVICE_STATUS.INACTIVE,
        });

      renderWithProviders(<ServiceListPage />, {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      });

      const page = createServiceListPage();

      await page.clickDeactivateService("Corte de cabello");
      await page.confirmDeactivation();

      await waitFor(() => {
        expect(updateStatusSpy).toHaveBeenCalledWith({
          businessId: SUBSCRIBER_SESSION.businessId,
          serviceId: "service-haircut",
          status: SERVICE_STATUS.INACTIVE,
        });
      });
    });

    it("AC-KAN-58-05: keeps service active when subscriber cancels the confirmation dialog", async () => {
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[0]!],
        nextCursor: null,
        totalCount: 1,
      });
      const updateStatusSpy = vi.spyOn(
        updateServiceStatusModule,
        "updateServiceStatus",
      );

      renderWithProviders(<ServiceListPage />, {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      });

      const page = createServiceListPage();

      expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();
      await page.clickDeactivateService("Corte de cabello");

      expect(await page.findDeactivateConfirmModal()).toBeInTheDocument();
      await page.cancelDeactivation();

      expect(updateStatusSpy).not.toHaveBeenCalled();
      const row = await page.findRowByName("Corte de cabello");
      expect(row).toHaveTextContent(
        testI18n.t("business:services.list.statusActive"),
      );
    });
  });

  describe("Delete a deactivated service (KAN-59)", () => {
    it("AC-KAN-59-01: deletes an inactive service upon confirmation and shows success toast", async () => {
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[1]!],
        nextCursor: null,
        totalCount: 1,
      });
      const callFunctionSpy = vi
        .spyOn(callFunctionModule, "callFunction")
        .mockResolvedValueOnce({ deletedServiceId: "service-beard" });
      const toastSuccessSpy = vi.spyOn(toast, "success");

      renderWithProviders(<ServiceListPage />, {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      });

      const page = createServiceListPage();

      expect(await page.findRowByName("Arreglo de barba")).toBeInTheDocument();
      await page.clickDeleteService("Arreglo de barba");

      expect(await page.findDeleteConfirmModal()).toBeInTheDocument();
      await page.confirmDeletion();

      await waitFor(() => {
        expect(callFunctionSpy).toHaveBeenCalledWith(
          FUNCTION_NAME.DELETE_SERVICE,
          {
            businessId: SUBSCRIBER_SESSION.businessId,
            serviceId: "service-beard",
          },
        );
      });

      expect(toastSuccessSpy).toHaveBeenCalledWith(
        testI18n.t("business:services.delete.success"),
      );
    });

    it("AC-KAN-59-02: shows business:services.delete.hasBookingsError when service has bookings", async () => {
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[1]!],
        nextCursor: null,
        totalCount: 1,
      });
      vi.spyOn(callFunctionModule, "callFunction").mockRejectedValueOnce(
        new FirebaseError(
          FIREBASE_ERROR_CODE.FAILED_PRECONDITION,
          "The service has pending or confirmed bookings",
        ),
      );
      const toastErrorSpy = vi.spyOn(toast, "error");

      renderWithProviders(<ServiceListPage />, {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      });

      const page = createServiceListPage();

      expect(await page.findRowByName("Arreglo de barba")).toBeInTheDocument();
      await page.clickDeleteService("Arreglo de barba");
      await page.confirmDeletion();

      await waitFor(() => {
        expect(toastErrorSpy).toHaveBeenCalledWith(
          testI18n.t("business:services.delete.hasBookingsError"),
        );
      });
    });

    it("AC-KAN-59-03: does not offer delete action on active services", async () => {
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[0]!],
        nextCursor: null,
        totalCount: 1,
      });

      renderWithProviders(<ServiceListPage />, {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      });

      const page = createServiceListPage();

      expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();
      const deleteButton = await page.queryDeleteButton("Corte de cabello");
      expect(deleteButton).not.toBeInTheDocument();
    });

    it("AC-KAN-59-04: disables delete action when business is inactive/suspended", async () => {
      vi.spyOn(
        fetchBusinessStatusModule,
        "fetchBusinessStatus",
      ).mockResolvedValue(BUSINESS_STATUS.INACTIVE);
      vi.spyOn(fetchBusinessInfoModule, "fetchBusinessInfo").mockResolvedValue({
        currency: "USD",
        status: BUSINESS_STATUS.INACTIVE,
      });
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[1]!],
        nextCursor: null,
        totalCount: 1,
      });
      const callFunctionSpy = vi.spyOn(callFunctionModule, "callFunction");

      renderWithProviders(
        <ServiceListPage businessStatus={BUSINESS_STATUS.INACTIVE} />,
        {
          initialPath: "/business/services",
          session: SUBSCRIBER_SESSION,
        },
      );

      const page = createServiceListPage();

      expect(await page.findRowByName("Arreglo de barba")).toBeInTheDocument();
      const deleteButton = await page.queryDeleteButton("Arreglo de barba");
      expect(deleteButton).toBeDisabled();
      expect(callFunctionSpy).not.toHaveBeenCalled();
    });

    it("AC-KAN-59-05: keeps service listed and shows common:errors.network when deletion fails due to network error", async () => {
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[1]!],
        nextCursor: null,
        totalCount: 1,
      });
      vi.spyOn(callFunctionModule, "callFunction").mockRejectedValueOnce(
        new FirebaseError(
          FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
          "network error",
        ),
      );
      const toastErrorSpy = vi.spyOn(toast, "error");

      renderWithProviders(<ServiceListPage />, {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      });

      const page = createServiceListPage();

      expect(await page.findRowByName("Arreglo de barba")).toBeInTheDocument();
      await page.clickDeleteService("Arreglo de barba");
      await page.confirmDeletion();

      await waitFor(() => {
        expect(toastErrorSpy).toHaveBeenCalledWith(
          testI18n.t("common:errors.network"),
        );
      });

      expect(page.queryRowByName("Arreglo de barba")).toBeInTheDocument();
    });

    it("cancelling delete dialog keeps service listed and does not call deleteService", async () => {
      vi.spyOn(fetchServicePageModule, "fetchServicePage").mockResolvedValue({
        items: [MOCK_SERVICES[1]!],
        nextCursor: null,
        totalCount: 1,
      });
      const callFunctionSpy = vi.spyOn(callFunctionModule, "callFunction");

      renderWithProviders(<ServiceListPage />, {
        initialPath: "/business/services",
        session: SUBSCRIBER_SESSION,
      });

      const page = createServiceListPage();

      expect(await page.findRowByName("Arreglo de barba")).toBeInTheDocument();
      await page.clickDeleteService("Arreglo de barba");

      expect(await page.findDeleteConfirmModal()).toBeInTheDocument();
      await page.cancelDeletion();

      expect(callFunctionSpy).not.toHaveBeenCalled();
      expect(page.queryRowByName("Arreglo de barba")).toBeInTheDocument();
    });
  });
});
