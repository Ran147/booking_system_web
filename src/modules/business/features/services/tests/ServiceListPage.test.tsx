import { screen, waitFor } from "@testing-library/react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BUSINESS_STATUS, SERVICE_STATUS } from "@/domain";
import { renderWithProviders, SUBSCRIBER_SESSION } from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { formatPrice, normalizeSearchTerm } from "@/utils";
import { createServiceListPage } from "./ServiceListPage.page";
import * as fetchBusinessInfoModule from "../api/fetchBusinessInfo";
import * as fetchBusinessStatusModule from "../api/fetchBusinessStatus";
import * as fetchServicePageModule from "../api/fetchServicePage";
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
        expect(page.queryRowByName("Corte de cabello")).toBeInTheDocument();
        expect(page.queryRowByName("Arreglo de barba")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
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

    await waitFor(async () => {
      expect(await page.findRowByName("Arreglo de barba")).toBeInTheDocument();
      expect(page.queryRowByName("Corte de cabello")).not.toBeInTheDocument();
      expect(page.queryRowByName("Tinte capilar")).not.toBeInTheDocument();
    });
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

    await waitFor(async () => {
      expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();
    });
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

    await waitFor(async () => {
      expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();
    });
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

    await waitFor(async () => {
      expect(await page.findRowByName("Arreglo de barba")).toBeInTheDocument();
    });

    await page.clickPreviousPage();

    await waitFor(async () => {
      expect(await page.findRowByName("Corte de cabello")).toBeInTheDocument();
    });
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
});
