// @vitest-environment node
import { callApiFunction } from "./callApiFunction";
import { firebaseAdminFake } from "./firebaseAdminFake";

// payPlanCheckout of the Vercel backend, with the same cases as
// functions/src/billing/tests/payPlanCheckout.test.ts (KAN-22 spec of
// 2026-10-31 §5). Google is replaced by a fetch stub.
vi.mock("firebase-admin/app", () => ({
  cert: vi.fn(),
  getApps: (): object[] => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/auth", async () => {
  const { firebaseAdminFake: fake } = await import("./firebaseAdminFake");
  return { getAuth: (): typeof fake.auth => fake.auth };
});

vi.mock("firebase-admin/firestore", async () => {
  const { firebaseAdminFake: fake } = await import("./firebaseAdminFake");
  return {
    getFirestore: (): typeof fake.firestore => fake.firestore,
    Timestamp: {
      fromMillis: fake.createTimestamp,
      now: (): ReturnType<typeof fake.createTimestamp> =>
        fake.createTimestamp(Date.now()),
    },
  };
});

const ATTEMPT_ID = "6f1c2a4e-8b3d-4f5a-9c7e-1d2b3a4c5e6f";
const SECOND_ATTEMPT_ID = "0a9b8c7d-6e5f-4a3b-8c1d-2e3f4a5b6c7d";
const PLAN_ID = "test-plan-pro";
const PLAN_PATH = `plans/${PLAN_ID}`;
const PLAN_PRICE_IN_CENTS = 49_900;
const APPROVED_CARD_NUMBER = "4242 4242 4242 4242";
const DECLINED_CARD_NUMBER = "4000000000000002";
const RECAPTCHA_TEST_SECRET = "recaptcha-test-secret";

const readCheckoutPath = (attemptId: string = ATTEMPT_ID): string =>
  `planCheckouts/${attemptId}`;

const buildCheckoutPayload = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  attemptId: ATTEMPT_ID,
  cardCvc: "123",
  cardExpiry: "12/40",
  cardNumber: APPROVED_CARD_NUMBER,
  cardholderName: "Ana Pérez",
  email: "owner@example.com",
  expectedPriceInCents: PLAN_PRICE_IN_CENTS,
  language: "es",
  planId: PLAN_ID,
  recaptchaToken: "recaptcha-token",
  termsAccepted: true,
  ...overrides,
});

const seedPlan = (overrides: Record<string, unknown> = {}): void => {
  firebaseAdminFake.documents.set(PLAN_PATH, {
    billingPeriod: "monthly",
    name: "Pro",
    priceInCents: PLAN_PRICE_IN_CENTS,
    status: "active",
    ...overrides,
  });
};

const answerRecaptcha = (isSuccess: boolean): void => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify({ success: isSuccess })),
    ),
  );
};

const countCheckouts = (): number =>
  [...firebaseAdminFake.documents.keys()].filter((path) =>
    path.startsWith("planCheckouts/"),
  ).length;

const payPlanCheckout = (
  overrides: Record<string, unknown> = {},
): ReturnType<typeof callApiFunction> =>
  callApiFunction("payPlanCheckout", buildCheckoutPayload(overrides));

describe("api callFunction: payPlanCheckout (KAN-22)", () => {
  beforeEach(() => {
    firebaseAdminFake.reset();
    vi.stubEnv("RECAPTCHA_SECRET_KEY", RECAPTCHA_TEST_SECRET);
    answerRecaptcha(true);
    seedPlan();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("AC-KAN-22-02: stores one PlanCheckout with the plan, the email, the plan amount, the payment date and the terms acceptance", async () => {
    const result = await payPlanCheckout();

    expect(result).toEqual({
      body: { email: "owner@example.com" },
      statusCode: 200,
    });
    expect(firebaseAdminFake.documents.get(readCheckoutPath())).toMatchObject({
      amountInCents: PLAN_PRICE_IN_CENTS,
      email: "owner@example.com",
      language: "es",
      paymentReference: expect.stringMatching(/^sim_[0-9a-f]{24}$/),
      planId: PLAN_ID,
      termsVersion: "provisional-2026-10-17",
    });
    const checkout = firebaseAdminFake.documents.get(readCheckoutPath());
    expect(checkout?.paidAt).toBeDefined();
    expect(checkout?.termsAcceptedAt).toEqual(checkout?.paidAt);
  });

  it("KAN-22: leaves the sign-up link for the KAN-24 email", async () => {
    await payPlanCheckout();

    expect(firebaseAdminFake.documents.get(readCheckoutPath())).toMatchObject({
      signUpCompletedAt: null,
      signUpLinkExpiresAt: null,
      signUpTokenHash: null,
    });
  });

  it("AC-KAN-22-03: creates no account, business or payment", async () => {
    await payPlanCheckout();

    expect(firebaseAdminFake.accounts.size).toBe(0);
    expect([...firebaseAdminFake.documents.keys()].sort()).toEqual([
      readCheckoutPath(),
      PLAN_PATH,
    ]);
  });

  it("AS-9: never stores the card data", async () => {
    await payPlanCheckout();

    const storedCheckout = JSON.stringify(
      firebaseAdminFake.documents.get(readCheckoutPath()),
    );
    expect(storedCheckout).not.toContain("4242");
    expect(storedCheckout).not.toContain("12/40");
    expect(storedCheckout).not.toContain("Ana Pérez");
  });

  it("AC-KAN-22-04: declines the test card, stores nothing and lets the visitor try again", async () => {
    const declinedResult = await payPlanCheckout({
      cardNumber: DECLINED_CARD_NUMBER,
    });
    const retryResult = await payPlanCheckout();

    expect(declinedResult).toMatchObject({
      body: {
        details: { reason: "paymentDeclined" },
        error: "failed-precondition",
      },
      statusCode: 412,
    });
    expect(retryResult.statusCode).toBe(200);
    expect(countCheckouts()).toBe(1);
  });

  it("AC-KAN-22-06: a rejected reCAPTCHA answers permission-denied and charges nothing", async () => {
    answerRecaptcha(false);

    const result = await payPlanCheckout();

    expect(result).toMatchObject({
      body: { error: "permission-denied" },
      statusCode: 403,
    });
    expect(countCheckouts()).toBe(0);
  });

  it("AC-KAN-22-06: sends the token and the secret key to Google", async () => {
    await payPlanCheckout();

    const [verifyUrl, requestInit] = vi.mocked(fetch).mock.calls[0] ?? [];
    const formFields = new URLSearchParams(String(requestInit?.body));
    expect(verifyUrl).toBe("https://www.google.com/recaptcha/api/siteverify");
    expect(formFields.get("response")).toBe("recaptcha-token");
    expect(formFields.get("secret")).toBe(RECAPTCHA_TEST_SECRET);
  });

  it.each([
    {
      label: "the secret key is missing",
      prepare: (): void => {
        vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
      },
    },
    {
      label: "Google cannot be reached",
      prepare: (): void => {
        vi.stubGlobal(
          "fetch",
          vi.fn(async (): Promise<Response> => {
            throw new Error("network down");
          }),
        );
      },
    },
  ])(
    "AC-KAN-22-06: when $label the payment answers unavailable and charges nothing",
    async ({ prepare }) => {
      prepare();

      const result = await payPlanCheckout();

      expect(result).toMatchObject({
        body: { error: "unavailable" },
        statusCode: 503,
      });
      expect(countCheckouts()).toBe(0);
    },
  );

  it.each([
    {
      label: "inactive",
      prepare: (): void => seedPlan({ status: "inactive" }),
    },
    {
      label: "deleted",
      prepare: (): void => {
        firebaseAdminFake.documents.delete(PLAN_PATH);
      },
    },
    {
      label: "malformed",
      prepare: (): void => seedPlan({ priceInCents: "49900" }),
    },
  ])(
    "AC-KAN-22-07: rejects a $label plan with planUnavailable and charges nothing",
    async ({ prepare }) => {
      prepare();

      const result = await payPlanCheckout();

      expect(result).toMatchObject({
        body: { details: { reason: "planUnavailable" } },
        statusCode: 412,
      });
      expect(countCheckouts()).toBe(0);
    },
  );

  it("AC-KAN-22-08: rejects a changed price with priceChanged, sends the new price and charges nothing", async () => {
    seedPlan({ priceInCents: 59_900 });

    const result = await payPlanCheckout();

    expect(result).toMatchObject({
      body: {
        details: { currentPriceInCents: 59_900, reason: "priceChanged" },
      },
      statusCode: 412,
    });
    expect(countCheckouts()).toBe(0);
  });

  it("AC-KAN-22-09: answers a retry of a paid attempt without charging it twice", async () => {
    await payPlanCheckout();
    const paidCheckout = firebaseAdminFake.documents.get(readCheckoutPath());

    const retryResult = await payPlanCheckout();

    expect(retryResult).toEqual({
      body: { email: "owner@example.com" },
      statusCode: 200,
    });
    expect(countCheckouts()).toBe(1);
    expect(firebaseAdminFake.documents.get(readCheckoutPath())).toBe(
      paidCheckout,
    );
  });

  it("AC-KAN-22-09: answers a retry after the plan was deactivated with the paid checkout", async () => {
    await payPlanCheckout();
    seedPlan({ status: "inactive" });

    const retryResult = await payPlanCheckout();

    expect(retryResult.statusCode).toBe(200);
    expect(countCheckouts()).toBe(1);
  });

  it("AC-KAN-22-09, AC-KAN-22-11: answers a retry whose email differs only in case and spaces with the paid checkout", async () => {
    await payPlanCheckout();

    const retryResult = await payPlanCheckout({
      email: "  Owner@Example.COM ",
    });

    expect(retryResult).toEqual({
      body: { email: "owner@example.com" },
      statusCode: 200,
    });
    expect(countCheckouts()).toBe(1);
  });

  it.each([
    { label: "another plan", overrides: { planId: "test-plan-basic" } },
    { label: "another email", overrides: { email: "other@example.com" } },
  ])(
    "KAN-22: rejects a paid attemptId reused with $label",
    async ({ overrides }) => {
      await payPlanCheckout();

      const result = await payPlanCheckout(overrides);

      expect(result).toMatchObject({
        body: { details: { reason: "attemptReused" } },
        statusCode: 412,
      });
      expect(firebaseAdminFake.documents.get(readCheckoutPath())).toMatchObject(
        { email: "owner@example.com", planId: PLAN_ID },
      );
    },
  );

  it("AC-KAN-22-10: stores one PlanCheckout when the same attempt arrives twice at once", async () => {
    const [firstResult, secondResult] = await Promise.all([
      payPlanCheckout(),
      payPlanCheckout(),
    ]);

    expect(firstResult.statusCode).toBe(200);
    expect(secondResult.statusCode).toBe(200);
    expect(countCheckouts()).toBe(1);
  });

  it("AC-KAN-22-11: stores the email trimmed and in lower case", async () => {
    await payPlanCheckout({
      attemptId: SECOND_ATTEMPT_ID,
      email: "  Owner@Example.COM ",
    });

    expect(
      firebaseAdminFake.documents.get(readCheckoutPath(SECOND_ATTEMPT_ID)),
    ).toMatchObject({ email: "owner@example.com" });
  });

  it("AS-9: accepts a card number typed without spaces", async () => {
    const result = await payPlanCheckout({ cardNumber: "4242424242424242" });

    expect(result.statusCode).toBe(200);
  });

  it.each([
    { label: "without accepted terms", overrides: { termsAccepted: false } },
    { label: "with an expired card", overrides: { cardExpiry: "01/20" } },
    {
      label: "with an attemptId that is not a UUID",
      overrides: { attemptId: "attempt-1" },
    },
    { label: "with a short card number", overrides: { cardNumber: "4242" } },
  ])(
    "KAN-22: rejects a payload $label with invalid-argument, before reCAPTCHA",
    async ({ overrides }) => {
      const result = await payPlanCheckout(overrides);

      expect(result).toMatchObject({
        body: { error: "invalid-argument" },
        statusCode: 400,
      });
      expect(fetch).not.toHaveBeenCalled();
      expect(countCheckouts()).toBe(0);
    },
  );
});
