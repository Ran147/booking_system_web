import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signOut } from "firebase/auth";
import type { RouteObject } from "react-router";
import type { Session } from "@/modules/auth";
import { landingRoutes } from "@/modules/landing/landing.routes";
import {
  ARIA_ROLE,
  ERROR_MESSAGE_KEY,
  LANGUAGE,
  ROUTE_PATH,
} from "@/shared/constants";
import {
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  renderRoutesWithProviders,
  testI18n,
} from "@/shared/test-utils";
import { fetchActivePlanDetails } from "../api/fetchActivePlanDetails";
import type { PlanDetail } from "../models/PlanDetail.interface";

vi.mock("../api/fetchActivePlanDetails", () => ({
  fetchActivePlanDetails: vi.fn(),
}));
vi.mock("firebase/auth", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  signOut: vi.fn(),
}));

const BASIC_PLAN: PlanDetail = {
  billingPeriod: "monthly",
  features: ["Recordatorios por correo", "Página pública del negocio"],
  id: "plan-basic",
  limits: { maxBookings: 200, maxCollaborators: 1 },
  name: "Básico",
  priceInCents: 29_900,
};

const PRO_PLAN: PlanDetail = {
  billingPeriod: "annual",
  features: ["Recordatorios por WhatsApp"],
  id: "plan-pro",
  limits: { maxBookings: 1_000 },
  name: "Pro",
  priceInCents: 59_900,
};

const CHECKOUT_TEXT = "checkout page";

const testRoutes: RouteObject[] = [
  ...landingRoutes,
  { element: <p>{CHECKOUT_TEXT}</p>, path: ROUTE_PATH.LANDING.PLAN_CHECKOUT },
];

const renderPlanDetail = (
  planId: string = BASIC_PLAN.id,
  session: Session = SIGNED_OUT_SESSION,
): void => {
  renderRoutesWithProviders(testRoutes, {
    initialPath: `${ROUTE_PATH.LANDING.PLANS}/${planId}`,
    session,
  });
};

const findPlanHeading = (planName: string): Promise<HTMLElement> =>
  screen.findByRole(ARIA_ROLE.HEADING, { level: 1, name: planName });

const getContractButton = (): HTMLElement =>
  screen.getByRole(ARIA_ROLE.BUTTON, {
    name: testI18n.t("landing:planCheckout.detail.contract"),
  });

describe("PlanDetailPage (KAN-21)", () => {
  beforeEach(() => {
    vi.mocked(fetchActivePlanDetails).mockReset();
    vi.mocked(fetchActivePlanDetails).mockResolvedValue([BASIC_PLAN, PRO_PLAN]);
    vi.mocked(signOut).mockReset();
  });

  afterEach(async () => {
    await testI18n.changeLanguage(LANGUAGE.ES);
  });

  it("KAN-21: AC-KAN-21-01 shows the name, price, billing period, features and every limit", async () => {
    renderPlanDetail();

    expect(await findPlanHeading("Básico")).toBeInTheDocument();
    expect(screen.getByText(/299,00/)).toBeInTheDocument();
    expect(
      screen.getByText(
        testI18n.t("landing:planCheckout.detail.billingPeriod.monthly"),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Recordatorios por correo")).toBeInTheDocument();
    expect(
      screen.getByText(
        testI18n.t("landing:planCheckout.detail.limits.maxBookings", {
          count: 200,
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        testI18n.t("landing:planCheckout.detail.limits.maxCollaborators", {
          count: 1,
        }),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-21: AC-KAN-21-02 links back to the plan catalog", async () => {
    renderPlanDetail();
    await findPlanHeading("Básico");

    expect(
      screen.getByRole("link", {
        name: testI18n.t("landing:planCheckout.detail.backToPlans"),
      }),
    ).toHaveAttribute("href", ROUTE_PATH.LANDING.HOME);
  });

  it("KAN-21: AC-KAN-21-03 switches to another plan and marks the current one", async () => {
    renderPlanDetail();
    await findPlanHeading("Básico");
    const otherPlansNavigation = screen.getByRole(ARIA_ROLE.NAVIGATION, {
      name: testI18n.t("landing:planCheckout.detail.otherPlans"),
    });

    expect(
      within(otherPlansNavigation).getByRole("link", { name: "Básico" }),
    ).toHaveAttribute("aria-current", "page");
    await userEvent.click(
      within(otherPlansNavigation).getByRole("link", { name: "Pro" }),
    );

    expect(await findPlanHeading("Pro")).toBeInTheDocument();
    expect(
      screen.getByText(
        testI18n.t("landing:planCheckout.detail.billingPeriod.annual"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-21: AC-KAN-21-04 shows not found for a plan id that does not exist", async () => {
    renderPlanDetail("plan-missing");

    expect(
      await screen.findByText(testI18n.t(ERROR_MESSAGE_KEY.NOT_FOUND)),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("landing:planCheckout.detail.contract"),
      }),
    ).not.toBeInTheDocument();
  });

  it("KAN-21: AC-KAN-21-05 shows an inactive plan as not found", async () => {
    // Inactive plans are not in the active list the page reads.
    vi.mocked(fetchActivePlanDetails).mockResolvedValue([PRO_PLAN]);
    renderPlanDetail(BASIC_PLAN.id);

    expect(
      await screen.findByText(testI18n.t(ERROR_MESSAGE_KEY.NOT_FOUND)),
    ).toBeInTheDocument();
  });

  it("KAN-21: AC-KAN-21-06 shows the network error and reads again on retry", async () => {
    vi.mocked(fetchActivePlanDetails).mockRejectedValueOnce({
      code: "unavailable",
      messageKey: ERROR_MESSAGE_KEY.NETWORK,
    });
    renderPlanDetail();

    expect(
      await screen.findByText(testI18n.t(ERROR_MESSAGE_KEY.NETWORK)),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("landing:planCheckout.detail.retryAction"),
      }),
    );

    expect(await findPlanHeading("Básico")).toBeInTheDocument();
  });

  it("KAN-21: AC-KAN-21-08 translates the labels and formats the price for the new language", async () => {
    renderPlanDetail();
    await findPlanHeading("Básico");

    await testI18n.changeLanguage(LANGUAGE.EN);

    expect(
      await screen.findByText(
        testI18n.t("landing:planCheckout.detail.billingPeriod.monthly"),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/299\.00/)).toBeInTheDocument();
  });

  it("KAN-21: AC-KAN-21-09 opens the checkout of the plan from the contract action", async () => {
    renderPlanDetail();
    await findPlanHeading("Básico");

    await userEvent.click(getContractButton());

    expect(await screen.findByText(CHECKOUT_TEXT)).toBeInTheDocument();
  });

  it("KAN-21: AC-KAN-21-10 does not open the checkout of a plan deactivated after the page loaded", async () => {
    renderPlanDetail();
    await findPlanHeading("Básico");
    vi.mocked(fetchActivePlanDetails).mockResolvedValue([PRO_PLAN]);

    await userEvent.click(getContractButton());

    expect(
      await screen.findByText(
        testI18n.t("landing:planCheckout.payment.planUnavailableError"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: testI18n.t("landing:planCheckout.detail.catalogAction"),
      }),
    ).toHaveAttribute("href", ROUTE_PATH.LANDING.HOME);
    expect(screen.queryByText(CHECKOUT_TEXT)).not.toBeInTheDocument();
    expect(
      screen.getByRole(ARIA_ROLE.HEADING, { level: 1, name: "Básico" }),
    ).toBeInTheDocument();
  });

  it("KAN-21: AC-KAN-21-10 stays on the detail with the network error when the plan cannot be checked", async () => {
    renderPlanDetail();
    await findPlanHeading("Básico");
    vi.mocked(fetchActivePlanDetails).mockRejectedValueOnce({
      code: "unavailable",
      messageKey: ERROR_MESSAGE_KEY.NETWORK,
    });

    await userEvent.click(getContractButton());

    expect(
      await screen.findByText(testI18n.t(ERROR_MESSAGE_KEY.NETWORK)),
    ).toBeInTheDocument();
    expect(screen.queryByText(CHECKOUT_TEXT)).not.toBeInTheDocument();
  });

  it("KAN-21: AC-KAN-21-11 asks a signed-in user to sign out instead of opening the checkout", async () => {
    renderPlanDetail(BASIC_PLAN.id, SUBSCRIBER_SESSION);
    await findPlanHeading("Básico");

    await userEvent.click(getContractButton());

    expect(
      screen.getByText(
        testI18n.t("landing:planCheckout.detail.signedInNotice"),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(CHECKOUT_TEXT)).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("landing:planCheckout.detail.signOutAction"),
      }),
    );
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
