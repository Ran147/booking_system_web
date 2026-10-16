import { screen, waitFor } from "@testing-library/react";
import { FUNCTION_NAME } from "@/shared/constants";
import { PASSWORD_RULE_ID, RESERVED_BUSINESS_SLUG } from "@/shared/domain";
import { callFunction } from "@/shared/lib/firebase";
import {
  SIGNED_OUT_SESSION,
  renderWithProviders,
  testI18n,
} from "@/shared/test-utils";
import { createSubscriberSignUpFormPage } from "./SubscriberSignUpForm.page";
import { RECAPTCHA_TEST_TOKEN } from "./recaptchaFieldDouble";
import {
  SIGN_UP_TEST_EMAIL,
  SIGN_UP_TEST_TOKEN,
  buildSignUpFunctionError,
  mockSignUpFunctions,
  readCallPayload,
} from "./signUpFunctionMocks";
import { SubscriberSignUpForm } from "../components/SubscriberSignUpForm";
import { SIGN_UP_ERROR_REASON } from "../constants/SubscriberSignUpServer.constants";
import type { CompleteSubscriberSignUpResponse } from "../models/CompleteSubscriberSignUp.mutation";

vi.mock("@/services/firebase/callFunction", () => ({ callFunction: vi.fn() }));
vi.mock("@/components/common/recaptcha-field", async () => ({
  RecaptchaField: (await import("./recaptchaFieldDouble")).RecaptchaFieldDouble,
}));

const CHECKOUT_EMAIL = SIGN_UP_TEST_EMAIL;
const STRONG_PASSWORD = "Reserva!2026";

const renderSignUpForm = (
  onSignUpComplete: (email: string) => void = vi.fn(),
): void => {
  renderWithProviders(
    <SubscriberSignUpForm
      checkoutEmail={CHECKOUT_EMAIL}
      onSignUpComplete={onSignUpComplete}
      signUpToken={SIGN_UP_TEST_TOKEN}
    />,
    { initialPath: "/sign-up", session: SIGNED_OUT_SESSION },
  );
};

const fillValidForm = async (
  signUpPage: ReturnType<typeof createSubscriberSignUpFormPage>,
): Promise<void> => {
  await signUpPage.typeInto("firstName", "Ana");
  await signUpPage.typeInto("lastName", "Pérez");
  await signUpPage.typeInto("password", STRONG_PASSWORD);
  await signUpPage.typeInto("passwordConfirmation", STRONG_PASSWORD);
  await signUpPage.typeInto("businessName", "Barbería Centro");
  await signUpPage.solveRecaptcha();
};

const readCompleteSignUpCalls = (): unknown[] =>
  readCallPayload(FUNCTION_NAME.COMPLETE_SUBSCRIBER_SIGN_UP);

describe("SubscriberSignUpForm (KAN-25)", () => {
  beforeEach(() => {
    vi.mocked(callFunction).mockReset();
    mockSignUpFunctions();
  });

  it("KAN-25: AC-KAN-25-01 sends the personal, account and business data and finishes the sign-up", async () => {
    const handleSignUpComplete = vi.fn();
    renderSignUpForm(handleSignUpComplete);
    const signUpPage = createSubscriberSignUpFormPage();

    await fillValidForm(signUpPage);
    await signUpPage.clickSubmit();

    await waitFor(() => {
      expect(handleSignUpComplete).toHaveBeenCalledWith(SIGN_UP_TEST_EMAIL);
    });
    expect(readCompleteSignUpCalls()).toEqual([
      {
        businessName: "Barbería Centro",
        businessSlug: "barberia-centro",
        firstName: "Ana",
        language: testI18n.language,
        lastName: "Pérez",
        password: STRONG_PASSWORD,
        phone: "",
        recaptchaToken: RECAPTCHA_TEST_TOKEN,
        signUpToken: SIGN_UP_TEST_TOKEN,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    ]);
  });

  it("KAN-25: AC-KAN-25-02 updates the strength level while typing", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("password", "reserva");
    expect(signUpPage.getStrengthStatus()).toHaveTextContent(
      testI18n.t("common:auth.password.strength.weak"),
    );

    await signUpPage.typeInto("password", "!2026A");
    expect(signUpPage.getStrengthStatus()).toHaveTextContent(
      testI18n.t("common:auth.password.strength.strong"),
    );
  });

  it("KAN-25: AC-KAN-25-03 shows the password without losing what was typed", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();
    await signUpPage.typeInto("password", STRONG_PASSWORD);

    await signUpPage.togglePasswordVisibility();

    expect(signUpPage.getField("password")).toHaveAttribute("type", "text");
    expect(signUpPage.getField("password")).toHaveValue(STRONG_PASSWORD);
    expect(signUpPage.getPasswordToggle()).toHaveAccessibleName(
      testI18n.t("common:auth.password.hide"),
    );

    await signUpPage.togglePasswordVisibility();

    expect(signUpPage.getField("password")).toHaveAttribute("type", "password");
    expect(signUpPage.getField("password")).toHaveValue(STRONG_PASSWORD);
    expect(signUpPage.getPasswordToggle()).toHaveAccessibleName(
      testI18n.t("common:auth.password.show"),
    );
  });

  it("KAN-25: AC-KAN-25-04 marks empty required fields and does not submit", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();
    await signUpPage.solveRecaptcha();

    await signUpPage.clickSubmit();

    expect(
      await screen.findAllByText(testI18n.t("validation:required")),
    ).not.toHaveLength(0);
    expect(signUpPage.getField("firstName")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(readCompleteSignUpCalls()).toHaveLength(0);
  });

  it("KAN-25: AC-KAN-25-06 rejects a weak password", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("password", "reserva2026");
    await signUpPage.blurField("password");

    expect(
      await screen.findByText(testI18n.t("validation:passwordTooWeak")),
    ).toBeInTheDocument();
    expect(
      signUpPage.getPasswordRule(PASSWORD_RULE_ID.UPPERCASE),
    ).toHaveTextContent(testI18n.t("common:auth.password.ruleMissing"));
    expect(
      signUpPage.getPasswordRule(PASSWORD_RULE_ID.SYMBOL),
    ).toHaveTextContent(testI18n.t("common:auth.password.ruleMissing"));
    expect(
      signUpPage.getPasswordRule(PASSWORD_RULE_ID.DIGIT),
    ).toHaveTextContent(testI18n.t("common:auth.password.ruleMet"));
  });

  it("KAN-25: AC-KAN-25-07 warns when the confirmation does not match", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();
    await fillValidForm(signUpPage);
    await signUpPage.clearAndType("passwordConfirmation", "Reserva!2027");

    await signUpPage.clickSubmit();

    expect(
      await screen.findByText(
        testI18n.t("landing:subscriberSignUp.form.passwordMismatch"),
      ),
    ).toBeInTheDocument();
    expect(readCompleteSignUpCalls()).toHaveLength(0);
  });

  it("KAN-25: AC-KAN-25-11 rejects a name that is too short", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("firstName", "A");
    await signUpPage.blurField("firstName");

    expect(
      await screen.findByText(testI18n.t("validation:tooShort")),
    ).toBeInTheDocument();
  });

  it("KAN-25: AC-KAN-25-13 disables submit while the sign-up is pending", async () => {
    let resolveSignUp: (
      response: CompleteSubscriberSignUpResponse,
    ) => void = () => undefined;
    mockSignUpFunctions({
      completeSubscriberSignUp: async () =>
        new Promise<CompleteSubscriberSignUpResponse>((resolve) => {
          resolveSignUp = resolve;
        }),
    });
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();
    await fillValidForm(signUpPage);

    await signUpPage.clickSubmit();

    await waitFor(() => {
      expect(signUpPage.getSubmitButton()).toBeDisabled();
    });
    await signUpPage.clickSubmit();
    expect(readCompleteSignUpCalls()).toHaveLength(1);

    resolveSignUp({ email: SIGN_UP_TEST_EMAIL });
    await waitFor(() => {
      expect(signUpPage.getSubmitButton()).toBeEnabled();
    });
  });

  it("KAN-25: AC-KAN-25-14 shows the checkout email read-only", () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    expect(signUpPage.getField("email")).toHaveValue(CHECKOUT_EMAIL);
    expect(signUpPage.getField("email")).toHaveAttribute("readonly");
  });

  it("KAN-25: AC-KAN-25-15 suggests the slug from the business name and shows the address", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("businessName", "Peluquería Doña Ana");

    expect(signUpPage.getField("businessSlug")).toHaveValue(
      "peluqueria-dona-ana",
    );
    expect(
      screen.getByText(
        testI18n.t("landing:subscriberSignUp.form.businessSlugHint", {
          businessAddress: "/peluqueria-dona-ana",
        }),
        { exact: false },
      ),
    ).toBeInTheDocument();
  });

  it("KAN-25: AC-KAN-25-15 keeps a slug the visitor edited", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();
    await signUpPage.typeInto("businessName", "Barbería");
    await signUpPage.clearAndType("businessSlug", "mi-barberia");

    await signUpPage.typeInto("businessName", " Centro");

    expect(signUpPage.getField("businessSlug")).toHaveValue("mi-barberia");
  });

  it("KAN-25: AC-KAN-25-17 rejects a reserved slug", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("businessSlug", RESERVED_BUSINESS_SLUG.ADMIN);
    await signUpPage.blurField("businessSlug");

    expect(
      await screen.findByText(
        testI18n.t("landing:subscriberSignUp.form.slugReservedError"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-25: AC-KAN-25-19 rejects a slug with invalid characters", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("businessSlug", "mi_barberia");
    await signUpPage.blurField("businessSlug");

    expect(
      await screen.findByText(
        testI18n.t("landing:subscriberSignUp.form.slugInvalidError"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-25: AC-KAN-25-15 tells that a free slug is available once the visitor stops typing", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("businessName", "Barbería Centro");

    expect(
      await screen.findByText(
        new RegExp(testI18n.t("landing:subscriberSignUp.form.slugAvailable")),
      ),
    ).toBeInTheDocument();
    expect(readCallPayload(FUNCTION_NAME.CHECK_BUSINESS_SLUG).at(-1)).toEqual({
      businessSlug: "barberia-centro",
      signUpToken: SIGN_UP_TEST_TOKEN,
    });
  });

  it("KAN-25: AC-KAN-25-18 warns while typing that the slug is taken", async () => {
    mockSignUpFunctions({
      checkBusinessSlug: async () => ({ availability: "taken" }),
    });
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("businessName", "Barbería Centro");

    expect(
      await screen.findByText(
        testI18n.t("landing:subscriberSignUp.form.slugTakenError"),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-25: AC-KAN-25-18 shows the server's taken slug on the slug field", async () => {
    const handleSignUpComplete = vi.fn();
    mockSignUpFunctions({
      completeSubscriberSignUp: async () => {
        throw buildSignUpFunctionError(
          "already-exists",
          SIGN_UP_ERROR_REASON.SLUG_TAKEN,
        );
      },
    });
    renderSignUpForm(handleSignUpComplete);
    const signUpPage = createSubscriberSignUpFormPage();
    await fillValidForm(signUpPage);

    await signUpPage.clickSubmit();

    expect(
      await screen.findByText(
        testI18n.t("landing:subscriberSignUp.form.slugTakenError"),
      ),
    ).toBeInTheDocument();
    expect(signUpPage.getField("businessSlug")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(handleSignUpComplete).not.toHaveBeenCalled();
  });

  it("KAN-25: AC-KAN-25-09 shows a neutral message with sign-in and recovery links when the email has an account", async () => {
    mockSignUpFunctions({
      completeSubscriberSignUp: async () => {
        throw buildSignUpFunctionError(
          "already-exists",
          SIGN_UP_ERROR_REASON.ACCOUNT_EXISTS,
        );
      },
    });
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();
    await fillValidForm(signUpPage);

    await signUpPage.clickSubmit();

    expect(
      await screen.findByText(
        testI18n.t("landing:subscriberSignUp.form.cannotCreateAccount"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: testI18n.t("landing:subscriberSignUp.form.signInAction"),
      }),
    ).toHaveAttribute("href", "/sign-in");
    expect(
      screen.getByRole("link", {
        name: testI18n.t(
          "landing:subscriberSignUp.form.passwordRecoveryAction",
        ),
      }),
    ).toHaveAttribute("href", "/password-recovery");
  });

  it("KAN-25: AC-KAN-25-10 keeps the values but the passwords when the network fails", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    mockSignUpFunctions({
      completeSubscriberSignUp: async () => {
        throw buildSignUpFunctionError("internal");
      },
    });
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();
    await fillValidForm(signUpPage);

    await signUpPage.clickSubmit();

    expect(
      await screen.findByText(testI18n.t("common:errors.network")),
    ).toBeInTheDocument();
    expect(signUpPage.getField("firstName")).toHaveValue("Ana");
    expect(signUpPage.getField("businessSlug")).toHaveValue("barberia-centro");
    expect(signUpPage.getField("password")).toHaveValue("");
    expect(signUpPage.getField("passwordConfirmation")).toHaveValue("");
    vi.restoreAllMocks();
  });

  it("KAN-25: AC-KAN-25-22 shows the unknown error when the server fails", async () => {
    const handleSignUpComplete = vi.fn();
    mockSignUpFunctions({
      completeSubscriberSignUp: async () => {
        throw buildSignUpFunctionError("internal");
      },
    });
    renderSignUpForm(handleSignUpComplete);
    const signUpPage = createSubscriberSignUpFormPage();
    await fillValidForm(signUpPage);

    await signUpPage.clickSubmit();

    expect(
      await screen.findByText(testI18n.t("common:errors.unknown")),
    ).toBeInTheDocument();
    expect(handleSignUpComplete).not.toHaveBeenCalled();
  });
  it("KAN-25: AC-KAN-25-08 keeps submit disabled until the reCAPTCHA is solved", async () => {
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();

    expect(signUpPage.getSubmitButton()).toBeDisabled();
    await signUpPage.solveRecaptcha();
    expect(signUpPage.getSubmitButton()).toBeEnabled();
  });

  it("KAN-25: AC-KAN-25-08 shows recaptchaRequired and resets the widget when the server rejects the token", async () => {
    const handleSignUpComplete = vi.fn();
    mockSignUpFunctions({
      completeSubscriberSignUp: async () => {
        throw buildSignUpFunctionError("permission-denied");
      },
    });
    renderSignUpForm(handleSignUpComplete);
    const signUpPage = createSubscriberSignUpFormPage();
    await fillValidForm(signUpPage);

    await signUpPage.clickSubmit();

    expect(
      await screen.findByText(testI18n.t("validation:recaptchaRequired")),
    ).toBeInTheDocument();
    expect(signUpPage.getRecaptcha()).toHaveAttribute("data-reset-signal", "1");
    expect(signUpPage.getSubmitButton()).toBeDisabled();
    expect(handleSignUpComplete).not.toHaveBeenCalled();
  });

  it("KAN-25: AC-KAN-25-10 shows the network error when the reCAPTCHA check cannot reach Google", async () => {
    mockSignUpFunctions({
      completeSubscriberSignUp: async () => {
        throw buildSignUpFunctionError("unavailable");
      },
    });
    renderSignUpForm();
    const signUpPage = createSubscriberSignUpFormPage();
    await fillValidForm(signUpPage);

    await signUpPage.clickSubmit();

    expect(
      await screen.findByText(testI18n.t("common:errors.network")),
    ).toBeInTheDocument();
    expect(signUpPage.getField("firstName")).toHaveValue("Ana");
  });
});
