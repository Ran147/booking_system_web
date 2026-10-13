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

  it("KAN2-11: AC-KAN2-11-01 displays the business dashboard with statistics metrics cards", async () => {
    renderWithProviders(<BusinessHomePage />, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SUBSCRIBER_SESSION,
    });
    const page = createBusinessHomePage();

    expect(await page.findPageTitle()).toBeInTheDocument();
    expect(await page.findActiveServicesMetric()).toBeInTheDocument();
    expect(await page.findBusinessStatusMetric()).toBeInTheDocument();
    expect(await page.findTodayBookingsMetric()).toBeInTheDocument();
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

  it("KAN2-11: AC-KAN2-11-05 displays collaborator role badge for collaborator session", async () => {
    renderWithProviders(<BusinessHomePage />, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: COLLABORATOR_SESSION,
    });
    const page = createBusinessHomePage();

    expect(await page.findPageTitle()).toBeInTheDocument();
    expect(
      screen.getByText(testI18n.t("business:home.roleCollaboratorBadge")),
    ).toBeInTheDocument();
  });
});
