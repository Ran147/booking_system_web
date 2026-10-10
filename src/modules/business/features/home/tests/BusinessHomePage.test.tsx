import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/constants";
import { BUSINESS_STATUS } from "@/domain";
import { renderWithProviders } from "@/shared/test-utils/renderWithProviders";
import {
  COLLABORATOR_SESSION,
  SUBSCRIBER_SESSION,
} from "@/shared/test-utils/sessionFixtures";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createBusinessHomePage } from "./BusinessHomePage.page";
import { fetchBusinessStatus } from "../api/fetchBusinessStatus";
import { BusinessHomePage } from "../components/BusinessHomePage";

vi.mock("../api/fetchBusinessStatus", () => ({
  fetchBusinessStatus: vi.fn(),
}));

describe("BusinessHomePage (KAN2-11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchBusinessStatus).mockResolvedValue(BUSINESS_STATUS.ACTIVE);
  });

  it("KAN2-11: AC-KAN2-11-01 displays the subscriber dashboard with tools and configuration sections", async () => {
    renderWithProviders(<BusinessHomePage />, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessHomePage();

    expect(await page.findPageTitle()).toBeInTheDocument();
    expect(await page.findQuickAccessHeading()).toBeInTheDocument();
    expect(await page.findConfigurationsHeading()).toBeInTheDocument();

    expect(
      screen.getByText(testI18n.t("business:home.tools.services.title")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(testI18n.t("business:home.tools.schedule.title")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(testI18n.t("business:home.tools.customers.title")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(testI18n.t("business:home.tools.reports.title")),
    ).toBeInTheDocument();
  });

  it("KAN2-11: AC-KAN2-11-02 provides quick access to create a service", async () => {
    const navigateSpy = vi.fn();

    renderWithProviders(<BusinessHomePage onNavigate={navigateSpy} />, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessHomePage();

    expect(await page.findPageTitle()).toBeInTheDocument();
    await page.clickCreateService();

    expect(navigateSpy).toHaveBeenCalledWith(
      `/business/${ROUTE_PATH.BUSINESS.SERVICE_NEW}`,
    );
  });

  it("KAN2-11: AC-KAN2-11-03 displays construction modal when clicking incomplete tools", async () => {
    renderWithProviders(<BusinessHomePage />, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessHomePage();

    expect(await page.findPageTitle()).toBeInTheDocument();
    await page.clickScheduleTool();

    expect(await page.findPlaceholderModalTitle()).toBeInTheDocument();
    await page.clickClosePlaceholderModal();

    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: testI18n.t("business:home.placeholderModalTitle"),
      }),
    ).not.toBeInTheDocument();
  });

  it("KAN2-11: AC-KAN2-11-04 displays read-only warning alert when business is inactive or suspended", async () => {
    vi.mocked(fetchBusinessStatus).mockResolvedValue(BUSINESS_STATUS.INACTIVE);

    renderWithProviders(
      <BusinessHomePage initialBusinessStatus={BUSINESS_STATUS.INACTIVE} />,
      {
        initialPath: ROUTE_PATH.BUSINESS.ROOT,
        session: SUBSCRIBER_SESSION,
      },
    );
    const page = createBusinessHomePage();

    expect(await page.findPageTitle()).toBeInTheDocument();
    expect(await page.findReadOnlyAlert()).toBeInTheDocument();
    expect(
      screen.getByText(testI18n.t("business:errors.readOnly")),
    ).toBeInTheDocument();
  });

  it("KAN2-11: AC-KAN2-11-05 adapts home view for collaborator role by omitting subscriber-only cards", async () => {
    renderWithProviders(<BusinessHomePage />, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: COLLABORATOR_SESSION,
    });
    const page = createBusinessHomePage();

    expect(await page.findPageTitle()).toBeInTheDocument();

    expect(
      screen.queryByText(testI18n.t("business:home.tools.collaborators.title")),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        testI18n.t("business:home.configs.subscription.title"),
      ),
    ).not.toBeInTheDocument();
  });
});
