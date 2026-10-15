import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BUSINESS_STATUS } from "@/domain";
import { renderWithProviders, SUBSCRIBER_SESSION } from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createServiceListPage } from "./ServiceListPage.page";
import * as fetchBusinessStatusModule from "../api/fetchBusinessStatus";
import { ServiceListPage } from "../components/ServiceListPage";

describe("ServiceListPage (KAN-55)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(
      fetchBusinessStatusModule,
      "fetchBusinessStatus",
    ).mockResolvedValue(BUSINESS_STATUS.ACTIVE);
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

  it("displays empty state feedback when there are no services registered", async () => {
    renderWithProviders(<ServiceListPage />, {
      initialPath: "/business/services",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceListPage();

    expect(await page.findEmptyStateTitle()).toBeInTheDocument();
    expect(await page.findEmptyStateDescription()).toBeInTheDocument();
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
});
