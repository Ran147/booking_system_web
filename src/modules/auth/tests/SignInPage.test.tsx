import { waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import type { ReactElement } from "react";
import type { RouteObject } from "react-router";
import type { RecaptchaFieldProps } from "@/components/common";
import {
  FIREBASE_ERROR_CODE,
  LANGUAGE,
  ROUTE_PATH,
  SEARCH_PARAM,
  VALIDATION_MESSAGE_KEY,
} from "@/constants";
import { renderRoutesWithProviders } from "@/test-utils/renderRoutesWithProviders";
import {
  COLLABORATOR_SESSION,
  CUSTOMER_SESSION,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  SUPER_ADMIN_SESSION,
} from "@/test-utils/sessionFixtures";
import { testI18n } from "@/test-utils/testI18n";
import type { Nullable } from "@/types";
import { CurrentPathProbe } from "./CurrentPathProbe";
import { createSignInPage, type SignInPageObject } from "./SignInPage.page";
import { signInWithPassword } from "../api/signInWithPassword";
import { authRoutes } from "../auth.routes";
import type { SignInResponse } from "../models/SignIn.mutation";

vi.mock("../api/signInWithPassword");

// Google's widget cannot run in jsdom: this double emits a token on click and
// exposes the reset signal it received.
vi.mock("@/components/common/recaptcha-field", async () => {
  const { testI18n: doubleI18n } = await import("@/test-utils/testI18n");
  return {
    RecaptchaField: ({
      onTokenChange,
      resetSignal,
    }: Pick<
      RecaptchaFieldProps,
      "onTokenChange" | "resetSignal"
    >): ReactElement => (
      <button
        data-reset-signal={resetSignal}
        onClick={() => onTokenChange("recaptcha-token")}
        type="button"
      >
        {doubleI18n.t("auth.signIn.recaptchaLabel")}
      </button>
    ),
  };
});

const VALID_EMAIL = "suscriptor@demo.test";
const VALID_PASSWORD = "Emulator-Only-123!";
const BUSINESS_PAGE_PATH = "/barberia-centro";

const responseFor = (
  session: SignInResponse["session"],
  language: SignInResponse["language"] = null,
): SignInResponse => ({ language, session });

const signInPathWithRedirect = (redirectPath: string): string =>
  `${ROUTE_PATH.AUTH.SIGN_IN}?${SEARCH_PARAM.REDIRECT_TO}=${encodeURIComponent(redirectPath)}`;

const testRoutes: RouteObject[] = [
  ...authRoutes,
  { element: <CurrentPathProbe />, path: ROUTE_PATH.NOT_FOUND },
];

const renderSignInPage = async (
  initialPath: string = ROUTE_PATH.AUTH.SIGN_IN,
): Promise<SignInPageObject> => {
  renderRoutesWithProviders(testRoutes, {
    initialPath,
    session: SIGNED_OUT_SESSION,
  });
  const signInPage = createSignInPage();
  await signInPage.findTitle();
  return signInPage;
};

const fillValidForm = async (signInPage: SignInPageObject): Promise<void> => {
  await signInPage.typeEmail(VALID_EMAIL);
  await signInPage.typePassword(VALID_PASSWORD);
  await signInPage.solveRecaptcha();
};

const rejectWith = (errorCode: string): void => {
  vi.mocked(signInWithPassword).mockRejectedValue(
    new FirebaseError(errorCode, errorCode),
  );
};

describe("SignInPage", () => {
  beforeEach(() => {
    vi.mocked(signInWithPassword).mockResolvedValue(
      responseFor(SUBSCRIBER_SESSION),
    );
  });

  afterEach(async () => {
    vi.clearAllMocks();
    if (testI18n.language !== LANGUAGE.ES) {
      await testI18n.changeLanguage(LANGUAGE.ES);
    }
  });

  describe("KAN-33 / KAN-129: sign in validating a reCAPTCHA", () => {
    it("AC-KAN-33-01: takes a subscriber to the business portal", async () => {
      const signInPage = await renderSignInPage();

      await fillValidForm(signInPage);
      await signInPage.submit();

      expect(await signInPage.findCurrentPath()).toBe(ROUTE_PATH.BUSINESS.ROOT);
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
        recaptchaToken: "recaptcha-token",
      });
    });

    it("AC-KAN-33-02: takes a super admin to the admin portal", async () => {
      vi.mocked(signInWithPassword).mockResolvedValue(
        responseFor(SUPER_ADMIN_SESSION),
      );
      const signInPage = await renderSignInPage();

      await fillValidForm(signInPage);
      await signInPage.submit();

      expect(await signInPage.findCurrentPath()).toBe(ROUTE_PATH.ADMIN.ROOT);
    });

    it("AC-KAN-33-03: returns to the protected page in redirectTo", async () => {
      const subscriptionPath = `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SUBSCRIPTION}`;
      const signInPage = await renderSignInPage(
        signInPathWithRedirect(subscriptionPath),
      );

      await fillValidForm(signInPage);
      await signInPage.submit();

      expect(await signInPage.findCurrentPath()).toBe(subscriptionPath);
    });

    it("AC-KAN-33-03: ignores a redirectTo that leaves the site", async () => {
      const signInPage = await renderSignInPage(
        signInPathWithRedirect("//evil.example"),
      );

      await fillValidForm(signInPage);
      await signInPage.submit();

      expect(await signInPage.findCurrentPath()).toBe(ROUTE_PATH.BUSINESS.ROOT);
    });

    it.each(["AC-KAN-33-04", "AC-KAN-129-03"])(
      "%s: keeps submit disabled until the reCAPTCHA is solved",
      async () => {
        const signInPage = await renderSignInPage();

        await signInPage.typeEmail(VALID_EMAIL);
        await signInPage.typePassword(VALID_PASSWORD);

        expect(signInPage.getSubmitButton()).toBeDisabled();
        await signInPage.solveRecaptcha();
        expect(signInPage.getSubmitButton()).toBeEnabled();
      },
    );

    it.each(["AC-KAN-33-04", "AC-KAN-129-03"])(
      "%s: shows recaptchaRequired and resets the widget when the server rejects the token",
      async () => {
        rejectWith(FIREBASE_ERROR_CODE.FUNCTIONS_PERMISSION_DENIED);
        const signInPage = await renderSignInPage();

        await fillValidForm(signInPage);
        await signInPage.submit();

        expect(await signInPage.findServerAlert()).toHaveTextContent(
          testI18n.t("validation:recaptchaRequired"),
        );
        expect(signInPage.getRecaptcha()).toHaveAttribute(
          "data-reset-signal",
          "1",
        );
        expect(signInPage.getSubmitButton()).toBeDisabled();
      },
    );

    it.each(["AC-KAN-33-05", "AC-KAN-129-04"])(
      "%s: keeps the email, clears the password and shows the network error",
      async () => {
        rejectWith(FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED);
        const signInPage = await renderSignInPage();

        await fillValidForm(signInPage);
        await signInPage.submit();

        expect(await signInPage.findServerAlert()).toHaveTextContent(
          testI18n.t("errors.network"),
        );
        expect(signInPage.getEmailInput()).toHaveValue(VALID_EMAIL);
        expect(signInPage.getPasswordInput()).toHaveValue("");
        expect(signInPage.getSubmitButton()).toBeDisabled();
      },
    );

    it("AC-KAN-33-05: shows the network error when the reCAPTCHA check cannot reach the server", async () => {
      rejectWith(FIREBASE_ERROR_CODE.FUNCTIONS_INTERNAL);
      const signInPage = await renderSignInPage();

      await fillValidForm(signInPage);
      await signInPage.submit();

      expect(await signInPage.findServerAlert()).toHaveTextContent(
        testI18n.t("errors.network"),
      );
    });

    it("AC-KAN-33-06: takes a subscriber of a suspended business to the business portal without reading the business", async () => {
      const signInPage = await renderSignInPage();

      await fillValidForm(signInPage);
      await signInPage.submit();

      expect(await signInPage.findCurrentPath()).toBe(ROUTE_PATH.BUSINESS.ROOT);
      expect(signInWithPassword).toHaveBeenCalledTimes(1);
    });

    it("AC-KAN-33-08: sends one attempt on double click and shows a loading state", async () => {
      vi.mocked(signInWithPassword).mockReturnValue(new Promise(() => {}));
      const signInPage = await renderSignInPage();

      await fillValidForm(signInPage);
      await signInPage.doubleClickSubmit();

      await waitFor(() =>
        expect(signInPage.getSubmittingButton()).toBeDisabled(),
      );
      expect(signInPage.getSubmittingButton()).toHaveAttribute(
        "aria-busy",
        "true",
      );
      expect(signInWithPassword).toHaveBeenCalledTimes(1);
    });

    it("AC-KAN-33-13: takes an active collaborator to the business portal", async () => {
      vi.mocked(signInWithPassword).mockResolvedValue(
        responseFor(COLLABORATOR_SESSION),
      );
      const signInPage = await renderSignInPage();

      await fillValidForm(signInPage);
      await signInPage.submit();

      expect(await signInPage.findCurrentPath()).toBe(ROUTE_PATH.BUSINESS.ROOT);
    });

    it("AC-KAN-33-14: tells a deactivated collaborator that the account is disabled", async () => {
      rejectWith(FIREBASE_ERROR_CODE.USER_DISABLED);
      const signInPage = await renderSignInPage();

      await fillValidForm(signInPage);
      await signInPage.submit();

      expect(await signInPage.findServerAlert()).toHaveTextContent(
        testI18n.t("auth.signIn.accountDisabled"),
      );
    });

    it("AC-KAN-129-01: takes a customer back to the business page in redirectTo", async () => {
      vi.mocked(signInWithPassword).mockResolvedValue(
        responseFor(CUSTOMER_SESSION),
      );
      const signInPage = await renderSignInPage(
        signInPathWithRedirect(BUSINESS_PAGE_PATH),
      );

      await fillValidForm(signInPage);
      await signInPage.submit();

      expect(await signInPage.findCurrentPath()).toBe(BUSINESS_PAGE_PATH);
    });

    it("AC-KAN-129-01: takes a customer without redirectTo to the landing until my bookings exists (P-1)", async () => {
      vi.mocked(signInWithPassword).mockResolvedValue(
        responseFor(CUSTOMER_SESSION),
      );
      const signInPage = await renderSignInPage();

      await fillValidForm(signInPage);
      await signInPage.submit();

      expect(await signInPage.findCurrentPath()).toBe(ROUTE_PATH.LANDING.HOME);
    });

    it("AC-KAN-129-02: switches the interface to the customer's language", async () => {
      vi.mocked(signInWithPassword).mockResolvedValue(
        responseFor(CUSTOMER_SESSION, LANGUAGE.EN),
      );
      const signInPage = await renderSignInPage();

      await fillValidForm(signInPage);
      await signInPage.submit();

      await signInPage.findCurrentPath();
      expect(testI18n.language).toBe(LANGUAGE.EN);
    });

    it("AC-KAN-129-05: signs in a customer blocked by a business, never reading Customer", async () => {
      vi.mocked(signInWithPassword).mockResolvedValue(
        responseFor(CUSTOMER_SESSION),
      );
      const signInPage = await renderSignInPage();

      await fillValidForm(signInPage);
      await signInPage.submit();

      expect(await signInPage.findCurrentPath()).toBe(ROUTE_PATH.LANDING.HOME);
      expect(signInWithPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe("KAN-34 / KAN-130: clear error messages", () => {
    it.each(["AC-KAN-34-01", "AC-KAN-130-01"])(
      "%s: removes a field error as soon as the value is valid",
      async () => {
        const signInPage = await renderSignInPage();

        await signInPage.typeEmail("correo-invalido");
        await signInPage.blurActiveField();
        expect(
          signInPage.queryFieldErrors(VALIDATION_MESSAGE_KEY.EMAIL_INVALID),
        ).toHaveLength(1);

        await signInPage.clearEmail();
        await signInPage.typeEmail(VALID_EMAIL);

        await waitFor(() =>
          expect(
            signInPage.queryFieldErrors(VALIDATION_MESSAGE_KEY.EMAIL_INVALID),
          ).toHaveLength(0),
        );
        expect(signInWithPassword).not.toHaveBeenCalled();
      },
    );

    it("AC-KAN-34-02: shows required when an empty field loses focus", async () => {
      const signInPage = await renderSignInPage();

      signInPage.getEmailInput().focus();
      await signInPage.blurActiveField();

      await waitFor(() =>
        expect(
          signInPage.queryFieldErrors(VALIDATION_MESSAGE_KEY.REQUIRED),
        ).toHaveLength(1),
      );
    });

    it.each(["AC-KAN-34-02", "AC-KAN-130-02"])(
      "%s: shows required on both fields on submit and makes no attempt",
      async () => {
        const signInPage = await renderSignInPage();

        await signInPage.solveRecaptcha();
        await signInPage.submit();

        await waitFor(() =>
          expect(
            signInPage.queryFieldErrors(VALIDATION_MESSAGE_KEY.REQUIRED),
          ).toHaveLength(2),
        );
        expect(signInWithPassword).not.toHaveBeenCalled();
      },
    );

    it.each(["AC-KAN-34-03", "AC-KAN-130-02"])(
      "%s: shows emailInvalid when the email loses focus",
      async () => {
        const signInPage = await renderSignInPage();

        await signInPage.typeEmail("correo@");
        await signInPage.blurActiveField();

        await waitFor(() =>
          expect(
            signInPage.queryFieldErrors(VALIDATION_MESSAGE_KEY.EMAIL_INVALID),
          ).toHaveLength(1),
        );
      },
    );

    it.each([
      ["AC-KAN-34-04", FIREBASE_ERROR_CODE.USER_NOT_FOUND],
      ["AC-KAN-34-04", FIREBASE_ERROR_CODE.WRONG_PASSWORD],
      ["AC-KAN-34-04", FIREBASE_ERROR_CODE.INVALID_CREDENTIAL],
      ["AC-KAN-130-03", FIREBASE_ERROR_CODE.INVALID_CREDENTIAL],
    ])(
      "%s: shows the same invalidCredentials message for %s",
      async (_criterionKey, errorCode) => {
        rejectWith(errorCode);
        const signInPage = await renderSignInPage();

        await fillValidForm(signInPage);
        await signInPage.submit();

        expect(await signInPage.findServerAlert()).toHaveTextContent(
          testI18n.t("auth.signIn.invalidCredentials"),
        );
      },
    );

    it.each(["AC-KAN-34-05", "AC-KAN-130-04"])(
      "%s: shows tooManyAttempts with a link to password recovery",
      async () => {
        rejectWith(FIREBASE_ERROR_CODE.TOO_MANY_REQUESTS);
        const signInPage = await renderSignInPage();

        await fillValidForm(signInPage);
        await signInPage.submit();

        const serverAlert = await signInPage.findServerAlert();
        expect(serverAlert).toHaveTextContent(
          testI18n.t("auth.signIn.tooManyAttempts"),
        );
        expect(serverAlert.querySelector("a")).toHaveAttribute(
          "href",
          ROUTE_PATH.AUTH.PASSWORD_RECOVERY,
        );
      },
    );

    it("AC-KAN-34-06: shows the unknown error and stays on sign-in", async () => {
      vi.mocked(signInWithPassword).mockRejectedValue(new Error("boom"));
      const signInPage = await renderSignInPage();

      await fillValidForm(signInPage);
      await signInPage.submit();

      expect(await signInPage.findServerAlert()).toHaveTextContent(
        testI18n.t("errors.unknown"),
      );
      expect(await signInPage.findTitle()).toBeInTheDocument();
    });

    it("AC-KAN-34-07: announces the server error and moves the focus to it", async () => {
      rejectWith(FIREBASE_ERROR_CODE.INVALID_CREDENTIAL);
      const signInPage = await renderSignInPage();

      await fillValidForm(signInPage);
      await signInPage.submit();

      const serverAlert = await signInPage.findServerAlert();
      await waitFor(() => expect(serverAlert).toHaveFocus());
    });
  });

  describe("KAN-35 / KAN-131: show or hide the password", () => {
    it.each(["AC-KAN-35-01", "AC-KAN-131-01"])(
      "%s: toggles the password keeping the value and the cursor",
      async () => {
        const signInPage = await renderSignInPage();
        await signInPage.typePassword(VALID_PASSWORD);

        await signInPage.togglePassword();
        expect(signInPage.getPasswordInput()).toHaveAttribute("type", "text");
        expect(signInPage.getPasswordInput()).toHaveValue(VALID_PASSWORD);
        expect(signInPage.getPasswordInput()).toHaveFocus();

        await signInPage.togglePassword();
        expect(signInPage.getPasswordInput()).toHaveAttribute(
          "type",
          "password",
        );
      },
    );

    it.each(["AC-KAN-35-02", "AC-KAN-131-01"])(
      "%s: names the control show or hide and reports its pressed state",
      async () => {
        const signInPage = await renderSignInPage();

        expect(signInPage.getPasswordToggle()).toHaveAccessibleName(
          testI18n.t("auth.password.show"),
        );
        expect(signInPage.getPasswordToggle()).toHaveAttribute(
          "aria-pressed",
          "false",
        );

        await signInPage.togglePassword();

        expect(signInPage.getPasswordToggle()).toHaveAccessibleName(
          testI18n.t("auth.password.hide"),
        );
        expect(signInPage.getPasswordToggle()).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      },
    );

    it.each(["AC-KAN-35-03", "AC-KAN-131-02"])(
      "%s: shows required for an empty visible password and keeps it visible",
      async () => {
        const signInPage = await renderSignInPage();
        await signInPage.typeEmail(VALID_EMAIL);
        await signInPage.togglePassword();
        await signInPage.solveRecaptcha();

        await signInPage.submit();

        await waitFor(() =>
          expect(
            signInPage.queryFieldErrors(VALIDATION_MESSAGE_KEY.REQUIRED),
          ).toHaveLength(1),
        );
        expect(signInPage.getPasswordToggle()).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        expect(signInWithPassword).not.toHaveBeenCalled();
      },
    );

    it.each(["AC-KAN-35-04", "AC-KAN-131-03"])(
      "%s: masks a visible password before the request is sent",
      async () => {
        let passwordTypeAtRequest: Nullable<string> = null;
        const signInPage = await renderSignInPage();
        vi.mocked(signInWithPassword).mockImplementation(async () => {
          passwordTypeAtRequest = signInPage
            .getPasswordInput()
            .getAttribute("type");
          return responseFor(SUBSCRIBER_SESSION);
        });
        await fillValidForm(signInPage);
        await signInPage.togglePassword();

        await signInPage.submit();

        await signInPage.findCurrentPath();
        expect(passwordTypeAtRequest).toBe("password");
      },
    );
  });
});
