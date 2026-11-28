import { screen } from "@testing-library/react";
import { generatePath, type RouteObject } from "react-router";
import { ROUTE_PATH } from "@/constants";
import {
  SIGNED_OUT_SESSION,
  renderRoutesWithProviders,
  testI18n,
} from "@/test-utils";
import { createPlanCheckoutTermsPage } from "./PlanCheckoutTerms.page";
import { fetchActivePlanDetails } from "../api/fetchActivePlanDetails";
import { PlanCheckoutPage } from "../components/PlanCheckoutPage";
import { TERMS_LINK } from "../constants/PlanCheckout.constants";
import type { PlanDetail } from "../models/PlanDetail.interface";

vi.mock("../api/fetchActivePlanDetails", () => ({
  fetchActivePlanDetails: vi.fn(),
}));

const BASIC_PLAN: PlanDetail = {
  billingPeriod: "monthly",
  features: [],
  id: "plan-basic",
  limits: {},
  name: "Básico",
  priceInCents: 29_900,
};

const checkoutRoutes: RouteObject[] = [
  { element: <PlanCheckoutPage />, path: ROUTE_PATH.LANDING.PLAN_CHECKOUT },
];

const renderCheckout = async (): Promise<void> => {
  renderRoutesWithProviders(checkoutRoutes, {
    initialPath: generatePath(ROUTE_PATH.LANDING.PLAN_CHECKOUT, {
      planId: BASIC_PLAN.id,
    }),
    session: SIGNED_OUT_SESSION,
  });
  await screen.findByText(BASIC_PLAN.name);
};

const OPEN_FIRST_TEXT = (): string =>
  testI18n.t("landing:planCheckout.terms.openFirst");
const TERMS_REQUIRED_TEXT = (): string =>
  testI18n.t("landing:planCheckout.checkout.termsRequired");

describe("PlanCheckoutPage terms (KAN-23)", () => {
  beforeEach(() => {
    vi.mocked(fetchActivePlanDetails).mockReset();
    vi.mocked(fetchActivePlanDetails).mockResolvedValue([BASIC_PLAN]);
  });

  it("KAN-23: AC-KAN-23-01 the terms link opens the KAN-9 terms in another tab and the form keeps its values", async () => {
    await renderCheckout();
    const termsPage = createPlanCheckoutTermsPage();

    await termsPage.typeEmail("duena@negocio.com");
    termsPage.openTerms();

    expect(termsPage.getTermsLink()).toHaveAttribute(
      "href",
      ROUTE_PATH.LANDING.TERMS,
    );
    expect(termsPage.getTermsLink()).toHaveAttribute(
      "target",
      TERMS_LINK.TARGET,
    );
    expect(termsPage.getEmailField()).toHaveValue("duena@negocio.com");
  });

  it("KAN-23: AC-KAN-23-04 the checkbox stays disabled until the terms were opened once (AS-11)", async () => {
    await renderCheckout();
    const termsPage = createPlanCheckoutTermsPage();

    expect(termsPage.getTermsCheckbox()).toBeDisabled();
    expect(screen.getByText(OPEN_FIRST_TEXT())).toBeInTheDocument();

    termsPage.openTerms();

    expect(termsPage.getTermsCheckbox()).toBeEnabled();
    expect(screen.queryByText(OPEN_FIRST_TEXT())).not.toBeInTheDocument();
  });

  it("KAN-23: AC-KAN-23-03 pay is disabled and the terms are asked for until they are accepted", async () => {
    await renderCheckout();
    const termsPage = createPlanCheckoutTermsPage();

    termsPage.openTerms();

    expect(termsPage.getPayButton()).toBeDisabled();
    expect(screen.getByText(TERMS_REQUIRED_TEXT())).toBeInTheDocument();

    await termsPage.acceptTerms();

    expect(termsPage.getTermsCheckbox()).toBeChecked();
    expect(screen.queryByText(TERMS_REQUIRED_TEXT())).not.toBeInTheDocument();
  });
});
