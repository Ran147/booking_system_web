import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import type { ReactElement } from "react";
import type { RecaptchaFieldProps } from "@/components/common";
import {
  FIREBASE_ERROR_CODE,
  LANGUAGE,
  ROUTE_PATH,
  VALIDATION_MESSAGE_KEY,
} from "@/constants";
import { renderRoutesWithProviders } from "@/test-utils/renderRoutesWithProviders";
import { SIGNED_OUT_SESSION } from "@/test-utils/sessionFixtures";
import { testI18n } from "@/test-utils/testI18n";
import {
  createPasswordRecoveryPage,
  type PasswordRecoveryPageObject,
} from "./PasswordRecoveryPage.page";
import { requestPasswordReset } from "../api/requestPasswordReset";
import { authRoutes } from "../auth.routes";
import { PASSWORD_RECOVERY } from "../constants/PasswordRecovery.constants";

vi.mock("../api/requestPasswordReset");

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

// The sign-in route is lazy; its first load in a run can exceed 1 s.
const LAZY_PAGE_TIMEOUT_MS = 4_000;
const VALID_EMAIL = "suscriptor@demo.test";

const renderPasswordRecoveryPage = async (
  advanceTimers?: (milliseconds: number) => void,
): Promise<PasswordRecoveryPageObject> => {
  renderRoutesWithProviders(authRoutes, {
    initialPath: ROUTE_PATH.AUTH.PASSWORD_RECOVERY,
    session: SIGNED_OUT_SESSION,
  });
  const passwordRecoveryPage = createPasswordRecoveryPage(advanceTimers);
  await passwordRecoveryPage.findTitle();
  return passwordRecoveryPage;
};

const fillValidForm = async (
  passwordRecoveryPage: PasswordRecoveryPageObject,
): Promise<void> => {
  await passwordRecoveryPage.typeEmail(VALID_EMAIL);
  await passwordRecoveryPage.solveRecaptcha();
};

const rejectWith = (errorCode: string): void => {
  vi.mocked(requestPasswordReset).mockRejectedValue(
    new FirebaseError(errorCode, errorCode),
  );
};

describe("PasswordRecoveryPage", () => {
  beforeEach(() => {
    vi.mocked(requestPasswordReset).mockResolvedValue({ isRequested: true });
  });

  afterEach(async () => {
    vi.clearAllMocks();
    vi.useRealTimers();
    if (testI18n.language !== LANGUAGE.ES) {
      await testI18n.changeLanguage(LANGUAGE.ES);
    }
  });

  describe("KAN-36 / KAN-132: request the recovery email", () => {
    it("AC-KAN-36-01: starts with the email typed on sign-in", async () => {
      renderRoutesWithProviders(authRoutes, {
        initialPath: ROUTE_PATH.AUTH.SIGN_IN,
        session: SIGNED_OUT_SESSION,
      });
      const user = userEvent.setup();
      await user.type(
        await screen.findByLabelText(
          testI18n.t("auth.signIn.emailLabel"),
          {},
          { timeout: LAZY_PAGE_TIMEOUT_MS },
        ),
        VALID_EMAIL,
      );

      await user.click(
        screen.getByRole("link", {
          name: testI18n.t("auth.signIn.forgotPassword"),
        }),
      );

      const passwordRecoveryPage = createPasswordRecoveryPage();
      await passwordRecoveryPage.findTitle();
      expect(passwordRecoveryPage.getEmailInput()).toHaveValue(VALID_EMAIL);
    });

    it("AC-KAN-36-01: starts empty when sign-in had no email", async () => {
      const passwordRecoveryPage = await renderPasswordRecoveryPage();

      expect(passwordRecoveryPage.getEmailInput()).toHaveValue("");
    });

    it.each(["AC-KAN-36-02", "AC-KAN-132-01"])(
      "%s: asks for the email and shows the neutral message",
      async () => {
        const passwordRecoveryPage = await renderPasswordRecoveryPage();

        await fillValidForm(passwordRecoveryPage);
        await passwordRecoveryPage.submit();

        expect(await passwordRecoveryPage.findSentNotice()).toBeInTheDocument();
        expect(requestPasswordReset).toHaveBeenCalledWith({
          email: VALID_EMAIL,
          recaptchaToken: "recaptcha-token",
        });
      },
    );

    it.each(["AC-KAN-36-03", "AC-KAN-132-03"])(
      "%s: shows required and emailInvalid and sends nothing",
      async () => {
        const passwordRecoveryPage = await renderPasswordRecoveryPage();
        await passwordRecoveryPage.solveRecaptcha();

        await passwordRecoveryPage.submit();
        expect(
          passwordRecoveryPage.queryFieldErrors(
            VALIDATION_MESSAGE_KEY.REQUIRED,
          ),
        ).toHaveLength(1);

        await passwordRecoveryPage.typeEmail("not-an-email");
        await passwordRecoveryPage.submit();
        expect(
          passwordRecoveryPage.queryFieldErrors(
            VALIDATION_MESSAGE_KEY.EMAIL_INVALID,
          ),
        ).toHaveLength(1);
        expect(requestPasswordReset).not.toHaveBeenCalled();
      },
    );

    it("AC-KAN-36-04: disables submit until the reCAPTCHA is solved", async () => {
      const passwordRecoveryPage = await renderPasswordRecoveryPage();

      await passwordRecoveryPage.typeEmail(VALID_EMAIL);
      expect(passwordRecoveryPage.getSubmitButton()).toBeDisabled();

      await passwordRecoveryPage.solveRecaptcha();
      expect(passwordRecoveryPage.getSubmitButton()).toBeEnabled();
    });

    it.each(["AC-KAN-36-04", "AC-KAN-132-03"])(
      "%s: a rejected token sends no email, shows recaptchaRequired and resets the widget",
      async () => {
        rejectWith(FIREBASE_ERROR_CODE.FUNCTIONS_PERMISSION_DENIED);
        const passwordRecoveryPage = await renderPasswordRecoveryPage();

        await fillValidForm(passwordRecoveryPage);
        await passwordRecoveryPage.submit();

        expect(await passwordRecoveryPage.findServerAlert()).toHaveTextContent(
          testI18n.t("validation:recaptchaRequired"),
        );
        expect(passwordRecoveryPage.querySentNotice()).toBeNull();
        expect(passwordRecoveryPage.getRecaptcha()).toHaveAttribute(
          "data-reset-signal",
          "1",
        );
        expect(passwordRecoveryPage.getSubmitButton()).toBeDisabled();
      },
    );

    it("AC-KAN-36-05: keeps the email and shows the network error", async () => {
      rejectWith(FIREBASE_ERROR_CODE.FUNCTIONS_UNAVAILABLE);
      const passwordRecoveryPage = await renderPasswordRecoveryPage();

      await fillValidForm(passwordRecoveryPage);
      await passwordRecoveryPage.submit();

      expect(await passwordRecoveryPage.findServerAlert()).toHaveTextContent(
        testI18n.t("errors.network"),
      );
      expect(passwordRecoveryPage.getEmailInput()).toHaveValue(VALID_EMAIL);
    });

    it("AC-KAN-36-06: blocks a new request with a countdown until the wait ends", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const passwordRecoveryPage = await renderPasswordRecoveryPage(
        vi.advanceTimersByTime,
      );

      await fillValidForm(passwordRecoveryPage);
      await passwordRecoveryPage.submit();
      await passwordRecoveryPage.findSentNotice();

      expect(
        passwordRecoveryPage.getCooldownButton(
          PASSWORD_RECOVERY.COOLDOWN_SECONDS,
        ),
      ).toBeDisabled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(
          PASSWORD_RECOVERY.COOLDOWN_SECONDS *
            PASSWORD_RECOVERY.COOLDOWN_TICK_MS,
        );
      });
      // A reCAPTCHA token is single-use: the user solves it again.
      await passwordRecoveryPage.solveRecaptcha();

      expect(passwordRecoveryPage.getSubmitButton()).toBeEnabled();
    });
  });
});
