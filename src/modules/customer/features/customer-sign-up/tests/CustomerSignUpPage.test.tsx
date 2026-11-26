import { screen, waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import type { RouteObject } from "react-router";
import {
  FIREBASE_ERROR_CODE,
  FUNCTION_NAME,
  ROUTE_PATH,
  type ValidationMessageKey,
} from "@/constants";
import { GuestOnly, type Session } from "@/modules/auth";
import { callFunction } from "@/services/firebase/callFunction";
import { renderRoutesWithProviders } from "@/test-utils/renderRoutesWithProviders";
import {
  CUSTOMER_SESSION,
  SIGNED_OUT_SESSION,
} from "@/test-utils/sessionFixtures";
import { testI18n } from "@/test-utils/testI18n";
import {
  createCustomerSignUpPage,
  type CustomerSignUpField,
  type CustomerSignUpPageObject,
} from "./CustomerSignUpPage.page";
import { RECAPTCHA_TEST_TOKEN } from "./recaptchaFieldDouble";
import { CustomerSignUpPage } from "../components/CustomerSignUpPage";
import { VERIFICATION_EMAIL_STATUS } from "../constants/CustomerSignUp.constants";

vi.mock("@/services/firebase/callFunction", () => ({ callFunction: vi.fn() }));
vi.mock("@/components/common/recaptcha-field", async () => ({
  RecaptchaField: (await import("./recaptchaFieldDouble")).RecaptchaFieldDouble,
}));

const BUSINESS_SLUG = "barberia-centro";
const SIGN_UP_PATH = `/${BUSINESS_SLUG}/${ROUTE_PATH.CUSTOMER.SIGN_UP}`;
const STRONG_PASSWORD = "Reserva!2026";
const HOME_TEXT = "landing-home";

// The real guard and page under /:businessSlug, without the business layout
// (it has its own tests): only what the sign-up needs.
const SIGN_UP_ROUTES: RouteObject[] = [
  {
    children: [
      {
        children: [
          {
            Component: CustomerSignUpPage,
            path: ROUTE_PATH.CUSTOMER.SIGN_UP,
          },
        ],
        element: <GuestOnly />,
      },
    ],
    path: ROUTE_PATH.CUSTOMER.ROOT,
  },
  { element: <p>{HOME_TEXT}</p>, path: ROUTE_PATH.LANDING.HOME },
];

const renderSignUpPage = (
  session: Session = SIGNED_OUT_SESSION,
): CustomerSignUpPageObject => {
  renderRoutesWithProviders(SIGN_UP_ROUTES, {
    initialPath: SIGN_UP_PATH,
    session,
  });
  return createCustomerSignUpPage();
};

const VALID_VALUES = Object.freeze({
  email: "  Ana.Perez@Demo.test ",
  fullName: "  Ana Pérez ",
  password: STRONG_PASSWORD,
  phone: "+506 8888-0000",
} as const);

// Fills every field except the one a test leaves empty, then solves the
// reCAPTCHA.
const fillValidForm = async (
  signUpPage: CustomerSignUpPageObject,
  emptyField?: CustomerSignUpField,
): Promise<void> => {
  for (const field of ["fullName", "phone", "email", "password"] as const) {
    if (field !== emptyField) {
      await signUpPage.typeInto(field, VALID_VALUES[field]);
    }
  }
  await signUpPage.solveRecaptcha();
};

const answerSignUpWith = (verificationEmail: string): void => {
  vi.mocked(callFunction).mockResolvedValue({ verificationEmail });
};

const rejectSignUpWith = (errorCode: string): void => {
  vi.mocked(callFunction).mockRejectedValue(
    new FirebaseError(errorCode, errorCode),
  );
};

const findValidationMessage = (
  validationKey: ValidationMessageKey,
): Promise<HTMLElement> =>
  screen.findByText(testI18n.t(`validation:${validationKey}`));

describe("CustomerSignUpPage (KAN-123)", () => {
  beforeEach(() => {
    answerSignUpWith(VERIFICATION_EMAIL_STATUS.SENT);
  });

  afterEach(() => {
    vi.mocked(callFunction).mockReset();
    vi.unstubAllGlobals();
  });

  it("AC-KAN-123-01 / AC-KAN-123-11: a valid form creates the account with the trimmed data and the business to return to", async () => {
    const signUpPage = renderSignUpPage();
    await signUpPage.findTitle();

    await fillValidForm(signUpPage);
    await signUpPage.clickSubmit();

    expect(
      await screen.findByText(testI18n.t("customer:signUp.verification.sent")),
    ).toBeInTheDocument();
    expect(callFunction).toHaveBeenCalledTimes(1);
    expect(callFunction).toHaveBeenCalledWith(
      FUNCTION_NAME.COMPLETE_CUSTOMER_SIGN_UP,
      {
        continueUrl: `${window.location.origin}/${BUSINESS_SLUG}`,
        email: "Ana.Perez@Demo.test",
        fullName: "Ana Pérez",
        language: "es",
        password: STRONG_PASSWORD,
        phone: "+506 8888-0000",
        recaptchaToken: RECAPTCHA_TEST_TOKEN,
      },
    );
  });

  it("AC-KAN-123-01: the form asks for nothing else than name, phone, email and password", async () => {
    const signUpPage = renderSignUpPage();
    await signUpPage.findTitle();

    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    expect(signUpPage.getField("password")).toHaveAttribute("type", "password");
  });

  it.each(["fullName", "phone", "email", "password"] as const)(
    "AC-KAN-123-02 / AC-KAN-123-12: an empty %s shows required and creates nothing",
    async (emptyField) => {
      const signUpPage = renderSignUpPage();
      await signUpPage.findTitle();
      await fillValidForm(signUpPage, emptyField);

      await signUpPage.clickSubmit();

      expect(await findValidationMessage("required")).toBeInTheDocument();
      expect(callFunction).not.toHaveBeenCalled();
    },
  );

  it("AC-KAN-123-03: an invalid email shows emailInvalid on blur", async () => {
    const signUpPage = renderSignUpPage();
    await signUpPage.findTitle();

    await signUpPage.typeInto("email", "ana-sin-arroba");
    await signUpPage.blurField();

    expect(await findValidationMessage("emailInvalid")).toBeInTheDocument();
  });

  it("AC-KAN-123-04: a name longer than 80 characters shows tooLong", async () => {
    const signUpPage = renderSignUpPage();
    await signUpPage.findTitle();

    await signUpPage.typeInto("fullName", "A".repeat(81));
    await signUpPage.blurField();

    expect(await findValidationMessage("tooLong")).toBeInTheDocument();
  });

  it("AC-KAN-123-13: a phone with letters shows phoneInvalid", async () => {
    const signUpPage = renderSignUpPage();
    await signUpPage.findTitle();

    await signUpPage.typeInto("phone", "8888-abcd");
    await signUpPage.blurField();

    expect(await findValidationMessage("phoneInvalid")).toBeInTheDocument();
  });

  it("AC-KAN-124-02 (field rule): a weak password shows passwordTooWeak and creates nothing", async () => {
    const signUpPage = renderSignUpPage();
    await signUpPage.findTitle();
    await signUpPage.typeInto("fullName", "Ana Pérez");
    await signUpPage.typeInto("phone", "+506 8888-0000");
    await signUpPage.typeInto("email", "ana@demo.test");
    await signUpPage.typeInto("password", "debil");
    await signUpPage.solveRecaptcha();

    await signUpPage.clickSubmit();

    expect(await findValidationMessage("passwordTooWeak")).toBeInTheDocument();
    expect(callFunction).not.toHaveBeenCalled();
  });

  it("AC-KAN-123-05: without the reCAPTCHA submit is disabled and recaptchaRequired is shown", async () => {
    const signUpPage = renderSignUpPage();
    await signUpPage.findTitle();

    expect(signUpPage.getSubmitButton()).toBeDisabled();
    expect(
      screen.getByText(testI18n.t("validation:recaptchaRequired")),
    ).toBeInTheDocument();
  });

  it("AC-KAN-123-05: a reCAPTCHA rejected by the server shows recaptchaRequired and asks for a new token", async () => {
    rejectSignUpWith(FIREBASE_ERROR_CODE.FUNCTIONS_PERMISSION_DENIED);
    const signUpPage = renderSignUpPage();
    await signUpPage.findTitle();
    await fillValidForm(signUpPage);

    await signUpPage.clickSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      testI18n.t("validation:recaptchaRequired"),
    );
    expect(signUpPage.getRecaptcha()).toHaveAttribute("data-reset-signal", "1");
    expect(signUpPage.getSubmitButton()).toBeDisabled();
  });

  it("AC-KAN-123-07: a network failure shows errors.network and keeps the data", async () => {
    vi.stubGlobal("navigator", { ...navigator, onLine: false });
    rejectSignUpWith(FIREBASE_ERROR_CODE.FUNCTIONS_INTERNAL);
    const signUpPage = renderSignUpPage();
    await signUpPage.findTitle();
    await fillValidForm(signUpPage);

    await signUpPage.clickSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      testI18n.t("common:errors.network"),
    );
    expect(signUpPage.getField("fullName")).toHaveValue("  Ana Pérez ");
    // type="email" inputs drop the outer spaces themselves.
    expect(signUpPage.getField("email")).toHaveValue("Ana.Perez@Demo.test");
    expect(signUpPage.getField("password")).toHaveValue(STRONG_PASSWORD);
  });

  it("AC-KAN-123-06: an email that already has an account shows the same result as a new one", async () => {
    answerSignUpWith(VERIFICATION_EMAIL_STATUS.SENT);
    const signUpPage = renderSignUpPage();
    await signUpPage.findTitle();
    await fillValidForm(signUpPage);

    await signUpPage.clickSubmit();

    expect(
      await screen.findByText(testI18n.t("customer:signUp.verification.sent")),
    ).toBeInTheDocument();
  });

  it("AC-KAN-126-04 (result): when the email could not be sent the account still exists and sendFailed is shown", async () => {
    answerSignUpWith(VERIFICATION_EMAIL_STATUS.SEND_FAILED);
    const signUpPage = renderSignUpPage();
    await signUpPage.findTitle();
    await fillValidForm(signUpPage);

    await signUpPage.clickSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      testI18n.t("customer:signUp.verification.sendFailed"),
    );
  });

  it("AC-KAN-123-10: a double click creates only one account", async () => {
    let resolveSignUp: (value: unknown) => void = () => undefined;
    vi.mocked(callFunction).mockReturnValue(
      new Promise((resolve) => {
        resolveSignUp = resolve;
      }),
    );
    const signUpPage = renderSignUpPage();
    await signUpPage.findTitle();
    await fillValidForm(signUpPage);

    await signUpPage.doubleClickSubmit();

    await waitFor(() => {
      expect(signUpPage.getSubmitButton()).toBeDisabled();
    });
    resolveSignUp({ verificationEmail: VERIFICATION_EMAIL_STATUS.SENT });
    expect(
      await screen.findByText(testI18n.t("customer:signUp.verification.sent")),
    ).toBeInTheDocument();
    expect(callFunction).toHaveBeenCalledTimes(1);
  });

  it("AC-KAN-123-08: a signed-in user is sent to their portal and never sees the form", async () => {
    renderSignUpPage(CUSTOMER_SESSION);

    expect(await screen.findByText(HOME_TEXT)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: testI18n.t("customer:signUp.title"),
      }),
    ).toBeNull();
  });
});
