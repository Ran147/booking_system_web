import { screen, waitFor } from "@testing-library/react";
import { FunctionsError } from "firebase/functions";
import { generatePath, type RouteObject } from "react-router";
import { ARIA_ROLE, FUNCTION_NAME, ROUTE_PATH } from "@/constants";
import { callFunction } from "@/services/firebase";
import {
  SIGNED_OUT_SESSION,
  renderRoutesWithProviders,
  testI18n,
} from "@/test-utils";
import {
  VALID_CHECKOUT_VALUES,
  createPlanCheckoutPage,
} from "./PlanCheckoutPage.page";
import { RECAPTCHA_TEST_TOKEN } from "./recaptchaFieldDouble";
import { fetchActivePlanDetails } from "../api/fetchActivePlanDetails";
import { PlanCheckoutPage } from "../components/PlanCheckoutPage";
import { PLAN_CHECKOUT_ERROR_REASON } from "../constants/PlanCheckout.constants";
import type { PayPlanCheckoutPayload } from "../models/PayPlanCheckout.mutation";
import type { PlanDetail } from "../models/PlanDetail.interface";

vi.mock("../api/fetchActivePlanDetails", () => ({
  fetchActivePlanDetails: vi.fn(),
}));
vi.mock("@/services/firebase/callFunction", () => ({ callFunction: vi.fn() }));
vi.mock("@/components/common/recaptcha-field", async () => ({
  RecaptchaField: (await import("./recaptchaFieldDouble")).RecaptchaFieldDouble,
}));

const BASIC_PLAN: PlanDetail = {
  billingPeriod: "monthly",
  features: ["Recordatorios por correo"],
  id: "plan-basic",
  limits: { maxBookings: 200 },
  name: "Básico",
  priceInCents: 29_900,
};

const checkoutRoutes: RouteObject[] = [
  { element: <PlanCheckoutPage />, path: ROUTE_PATH.LANDING.PLAN_CHECKOUT },
];

const STORED_EMAIL = "duena@negocio.com";
const NEW_PRICE_IN_CENTS = 34_900;

const buildCheckoutError = (
  code: "failed-precondition" | "permission-denied" | "unavailable",
  details?: object,
): FunctionsError => new FunctionsError(code, "test error", details);

const renderCheckout = async (): Promise<void> => {
  renderRoutesWithProviders(checkoutRoutes, {
    initialPath: generatePath(ROUTE_PATH.LANDING.PLAN_CHECKOUT, {
      planId: BASIC_PLAN.id,
    }),
    session: SIGNED_OUT_SESSION,
  });
  await screen.findByText(
    testI18n.t("landing:planCheckout.checkout.emailHint"),
  );
};

const readPayCalls = (): PayPlanCheckoutPayload[] =>
  vi
    .mocked(callFunction)
    .mock.calls.filter(
      ([functionName]) => functionName === FUNCTION_NAME.PAY_PLAN_CHECKOUT,
    )
    .map(([, payload]) => payload as PayPlanCheckoutPayload);

describe("PlanCheckoutPage (KAN-22)", () => {
  beforeEach(() => {
    vi.mocked(fetchActivePlanDetails).mockReset();
    vi.mocked(fetchActivePlanDetails).mockResolvedValue([BASIC_PLAN]);
    vi.mocked(callFunction).mockReset();
    vi.mocked(callFunction).mockResolvedValue({ email: STORED_EMAIL });
  });

  it("KAN-22: AC-KAN-22-01 shows the plan, its price and period, the email hint, the card fields, the terms and the reCAPTCHA", async () => {
    await renderCheckout();
    const checkoutPage = createPlanCheckoutPage();

    expect(screen.getByText(BASIC_PLAN.name)).toBeInTheDocument();
    expect(screen.getByText(/299,00/)).toBeInTheDocument();
    expect(
      screen.getByText(
        testI18n.t("landing:planCheckout.detail.billingPeriod.monthly"),
      ),
    ).toBeInTheDocument();
    for (const field of Object.keys(VALID_CHECKOUT_VALUES)) {
      expect(
        checkoutPage.getField(field as keyof typeof VALID_CHECKOUT_VALUES),
      ).toBeInTheDocument();
    }
    expect(checkoutPage.getTermsCheckbox()).toBeInTheDocument();
    expect(checkoutPage.getRecaptcha()).toBeInTheDocument();
  });

  it("KAN-22: AC-KAN-22-02 an approved payment sends the attempt to the server and shows the email it stored", async () => {
    await renderCheckout();

    await createPlanCheckoutPage().fillAndPay();

    expect(
      await screen.findByText(
        testI18n.t("landing:planCheckout.payment.success", {
          email: STORED_EMAIL,
        }),
      ),
    ).toBeInTheDocument();
    const [payPayload] = readPayCalls();
    expect(payPayload).toMatchObject({
      cardNumber: VALID_CHECKOUT_VALUES.cardNumber,
      email: VALID_CHECKOUT_VALUES.email,
      expectedPriceInCents: BASIC_PLAN.priceInCents,
      language: "es",
      planId: BASIC_PLAN.id,
      recaptchaToken: RECAPTCHA_TEST_TOKEN,
      termsAccepted: true,
    });
    expect(payPayload?.attemptId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("KAN-22: AC-KAN-22-03 the confirmation says the business is reviewed and offers no way to the sign-up", async () => {
    await renderCheckout();

    await createPlanCheckoutPage().fillAndPay();

    expect(
      await screen.findByText(
        testI18n.t("landing:planCheckout.payment.reviewNotice"),
      ),
    ).toBeInTheDocument();
    expect(createPlanCheckoutPage().queryPayButton()).not.toBeInTheDocument();
    for (const link of screen.queryAllByRole(ARIA_ROLE.LINK)) {
      expect(link).not.toHaveAttribute(
        "href",
        expect.stringContaining(ROUTE_PATH.LANDING.SIGN_UP),
      );
    }
    expect(
      screen
        .queryAllByRole(ARIA_ROLE.BUTTON)
        .map((button) => button.textContent),
    ).not.toContain(testI18n.t("landing:subscriberSignUp.form.submitAction"));
  });

  it("KAN-22: AC-KAN-22-04 a declined payment shows the error, empties the card fields and keeps the email", async () => {
    vi.mocked(callFunction).mockRejectedValue(
      buildCheckoutError("failed-precondition", {
        reason: PLAN_CHECKOUT_ERROR_REASON.PAYMENT_DECLINED,
      }),
    );
    await renderCheckout();
    const checkoutPage = createPlanCheckoutPage();

    await checkoutPage.fillAndPay();

    expect(
      await screen.findByText(
        testI18n.t("landing:planCheckout.checkout.declinedError"),
      ),
    ).toBeInTheDocument();
    expect(checkoutPage.getField("cardNumber")).toHaveValue("");
    expect(checkoutPage.getField("cardExpiry")).toHaveValue("");
    expect(checkoutPage.getField("cardCvc")).toHaveValue("");
    expect(checkoutPage.getField("cardholderName")).toHaveValue("");
    expect(checkoutPage.getField("email")).toHaveValue(
      VALID_CHECKOUT_VALUES.email,
    );
  });

  it("KAN-22: AC-KAN-22-05 empty or invalid fields show a translated message and nothing is sent", async () => {
    await renderCheckout();
    const checkoutPage = createPlanCheckoutPage();

    await checkoutPage.typeInto("email", "no-es-un-correo");
    await checkoutPage.typeInto("cardExpiry", "1240");
    await checkoutPage.solveRecaptcha();
    await checkoutPage.clickPay();

    expect(
      await screen.findByText(testI18n.t("validation:emailInvalid")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(testI18n.t("landing:planCheckout.payment.cardInvalid")),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(testI18n.t("validation:required")).length,
    ).toBeGreaterThan(0);
    expect(readPayCalls()).toHaveLength(0);
  });

  it("KAN-22: AC-KAN-22-06 pay is disabled without the reCAPTCHA, and a rejected token resets it and asks again", async () => {
    vi.mocked(callFunction).mockRejectedValue(
      buildCheckoutError("permission-denied"),
    );
    await renderCheckout();
    const checkoutPage = createPlanCheckoutPage();

    expect(checkoutPage.getPayButton()).toBeDisabled();

    await checkoutPage.fillAndPay();

    expect(
      await screen.findByText(testI18n.t("validation:recaptchaRequired")),
    ).toBeInTheDocument();
    expect(checkoutPage.getRecaptcha()).toHaveAttribute(
      "data-reset-signal",
      "1",
    );
    expect(checkoutPage.getPayButton()).toBeDisabled();
  });

  it("KAN-22: AC-KAN-22-07 a plan that is no longer available shows the error with a link to the catalog", async () => {
    vi.mocked(callFunction).mockRejectedValue(
      buildCheckoutError("failed-precondition", {
        reason: PLAN_CHECKOUT_ERROR_REASON.PLAN_UNAVAILABLE,
      }),
    );
    await renderCheckout();

    await createPlanCheckoutPage().fillAndPay();

    expect(
      await screen.findByText(
        testI18n.t("landing:planCheckout.payment.planUnavailableError"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole(ARIA_ROLE.LINK, {
        name: testI18n.t("landing:planCheckout.detail.catalogAction"),
      }),
    ).toBeInTheDocument();
  });

  it("KAN-22: AC-KAN-22-08 a changed price is shown and the next payment confirms it", async () => {
    vi.mocked(callFunction).mockRejectedValueOnce(
      buildCheckoutError("failed-precondition", {
        currentPriceInCents: NEW_PRICE_IN_CENTS,
        reason: PLAN_CHECKOUT_ERROR_REASON.PRICE_CHANGED,
      }),
    );
    await renderCheckout();
    const checkoutPage = createPlanCheckoutPage();

    await checkoutPage.fillAndPay();

    expect(await screen.findAllByText(/349,00/)).not.toHaveLength(0);
    await checkoutPage.solveRecaptcha();
    await checkoutPage.clickPay();

    await waitFor(() => expect(readPayCalls()).toHaveLength(2));
    expect(readPayCalls()[1]?.expectedPriceInCents).toBe(NEW_PRICE_IN_CENTS);
  });

  it("KAN-22: AC-KAN-22-09 a network failure shows the error and the retry sends the same attempt", async () => {
    vi.mocked(callFunction).mockRejectedValueOnce(
      buildCheckoutError("unavailable"),
    );
    await renderCheckout();
    const checkoutPage = createPlanCheckoutPage();

    await checkoutPage.fillAndPay();

    expect(
      await screen.findByText(testI18n.t("common:errors.network")),
    ).toBeInTheDocument();
    await checkoutPage.solveRecaptcha();
    await checkoutPage.clickPay();

    await waitFor(() => expect(readPayCalls()).toHaveLength(2));
    const [firstPayload, retryPayload] = readPayCalls();
    expect(retryPayload?.attemptId).toBe(firstPayload?.attemptId);
  });

  it("KAN-22: AC-KAN-22-10 while the payment is in progress the button is disabled and a second click sends nothing", async () => {
    vi.mocked(callFunction).mockReturnValue(new Promise(() => undefined));
    await renderCheckout();
    const checkoutPage = createPlanCheckoutPage();

    await checkoutPage.fillAndPay();

    await waitFor(() => expect(checkoutPage.getPayButton()).toBeDisabled());
    expect(checkoutPage.getPayButton()).toHaveTextContent(
      testI18n.t("landing:planCheckout.checkout.paying"),
    );
    await checkoutPage.clickPay();
    expect(readPayCalls()).toHaveLength(1);
  });
});
