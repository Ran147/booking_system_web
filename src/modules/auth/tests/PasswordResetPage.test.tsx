import { screen } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { toast } from "@/components/common";
import {
  FIREBASE_ERROR_CODE,
  LANGUAGE,
  ROUTE_PATH,
  SEARCH_PARAM,
  VALIDATION_MESSAGE_KEY,
} from "@/constants";
import { renderRoutesWithProviders } from "@/test-utils/renderRoutesWithProviders";
import { SIGNED_OUT_SESSION } from "@/test-utils/sessionFixtures";
import { testI18n } from "@/test-utils/testI18n";
import type { Nullable } from "@/types";
import {
  createPasswordResetPage,
  type PasswordResetPageObject,
} from "./PasswordResetPage.page";
import { confirmNewPassword } from "../api/confirmNewPassword";
import { verifyResetCode } from "../api/verifyResetCode";
import { authRoutes } from "../auth.routes";
import { PASSWORD_RESET_MODE } from "../constants/PasswordResetLink.constants";

vi.mock("../api/confirmNewPassword");
vi.mock("../api/verifyResetCode");

// The sign-in route is lazy; its first load in a run can exceed 1 s.
const LAZY_PAGE_TIMEOUT_MS = 4_000;
const OOB_CODE = "valid-oob-code";
const ACCOUNT_EMAIL = "suscriptor@demo.test";
const STRONG_PASSWORD = "Emulator-Only-123!";

const resetPath = (searchParameters: Record<string, string>): string =>
  `${ROUTE_PATH.AUTH.PASSWORD_RESET}?${new URLSearchParams(searchParameters).toString()}`;

const VALID_LINK_PATH = resetPath({
  [SEARCH_PARAM.MODE]: PASSWORD_RESET_MODE.RESET_PASSWORD,
  [SEARCH_PARAM.OOB_CODE]: OOB_CODE,
});

const renderPasswordResetPage = (
  initialPath: string = VALID_LINK_PATH,
): PasswordResetPageObject => {
  renderRoutesWithProviders(authRoutes, {
    initialPath,
    session: SIGNED_OUT_SESSION,
  });
  return createPasswordResetPage();
};

const rejectLinkCheckWith = (errorCode: string): void => {
  vi.mocked(verifyResetCode).mockRejectedValue(
    new FirebaseError(errorCode, errorCode),
  );
};

const fillValidForm = async (
  passwordResetPage: PasswordResetPageObject,
): Promise<void> => {
  await passwordResetPage.typeNewPassword(STRONG_PASSWORD);
  await passwordResetPage.typeConfirmation(STRONG_PASSWORD);
};

describe("PasswordResetPage", () => {
  beforeEach(() => {
    vi.mocked(verifyResetCode).mockResolvedValue(ACCOUNT_EMAIL);
    vi.mocked(confirmNewPassword).mockResolvedValue();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    if (testI18n.language !== LANGUAGE.ES) {
      await testI18n.changeLanguage(LANGUAGE.ES);
    }
  });

  describe("KAN-37 / KAN-132: set a new password", () => {
    it.each(["AC-KAN-37-01", "AC-KAN-132-02"])(
      "%s: the indicator marks every rule while typing",
      async () => {
        const passwordResetPage = renderPasswordResetPage();
        await passwordResetPage.findTitle();
        await screen.findByLabelText(
          testI18n.t("auth.passwordReset.newPasswordLabel"),
        );

        expect(passwordResetPage.getRuleItem("lowercase")).toHaveTextContent(
          testI18n.t("auth.password.ruleMissing"),
        );

        await passwordResetPage.typeNewPassword("abc");

        expect(passwordResetPage.getRuleItem("lowercase")).toHaveTextContent(
          testI18n.t("auth.password.ruleMet"),
        );
        expect(passwordResetPage.getRuleItem("uppercase")).toHaveTextContent(
          testI18n.t("auth.password.ruleMissing"),
        );

        await passwordResetPage.typeNewPassword("D1!efgh");

        expect(
          passwordResetPage.getRuleItem("minimumLength"),
        ).toHaveTextContent(testI18n.t("auth.password.ruleMet"));
        expect(passwordResetPage.getRuleItem("symbol")).toHaveTextContent(
          testI18n.t("auth.password.ruleMet"),
        );
      },
    );

    it.each(["AC-KAN-37-02", "AC-KAN-132-02"])(
      "%s: saves the new password, tells the user and goes to sign-in",
      async () => {
        const toastSuccess = vi.spyOn(toast, "success");
        const passwordResetPage = renderPasswordResetPage();
        await screen.findByLabelText(
          testI18n.t("auth.passwordReset.newPasswordLabel"),
        );

        await fillValidForm(passwordResetPage);
        await passwordResetPage.submit();

        expect(
          await screen.findByRole(
            "heading",
            { level: 1, name: testI18n.t("auth.signIn.title") },
            { timeout: LAZY_PAGE_TIMEOUT_MS },
          ),
        ).toBeInTheDocument();
        expect(confirmNewPassword).toHaveBeenCalledWith({
          newPassword: STRONG_PASSWORD,
          oobCode: OOB_CODE,
        });
        expect(toastSuccess).toHaveBeenCalledWith(
          testI18n.t("auth.passwordReset.success"),
        );
      },
    );

    it("AC-KAN-37-03: a password missing a rule shows passwordTooWeak and saves nothing", async () => {
      const passwordResetPage = renderPasswordResetPage();
      await screen.findByLabelText(
        testI18n.t("auth.passwordReset.newPasswordLabel"),
      );

      await passwordResetPage.typeNewPassword("abcdefgh");
      await passwordResetPage.typeConfirmation("abcdefgh");
      await passwordResetPage.submit();

      expect(
        passwordResetPage.queryFieldErrors(
          VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK,
        ),
      ).toHaveLength(1);
      expect(passwordResetPage.getRuleItem("uppercase")).toHaveTextContent(
        testI18n.t("auth.password.ruleMissing"),
      );
      expect(confirmNewPassword).not.toHaveBeenCalled();
    });

    it("AC-KAN-37-04: a different confirmation shows passwordMismatch on blur", async () => {
      const passwordResetPage = renderPasswordResetPage();
      await screen.findByLabelText(
        testI18n.t("auth.passwordReset.newPasswordLabel"),
      );

      await passwordResetPage.typeNewPassword(STRONG_PASSWORD);
      await passwordResetPage.typeConfirmation("Another-Pass-456?");
      await passwordResetPage.blurActiveField();

      expect(
        passwordResetPage.queryFieldErrors(
          VALIDATION_MESSAGE_KEY.PASSWORD_MISMATCH,
        ),
      ).toHaveLength(1);
      expect(confirmNewPassword).not.toHaveBeenCalled();
    });

    it.each([
      ["expired", FIREBASE_ERROR_CODE.EXPIRED_ACTION_CODE],
      ["already used or malformed", FIREBASE_ERROR_CODE.INVALID_ACTION_CODE],
    ])(
      "AC-KAN-37-05 / AC-KAN-132-04: a %s link shows linkInvalid and no form",
      async (_caseName, errorCode) => {
        rejectLinkCheckWith(errorCode);
        const passwordResetPage = renderPasswordResetPage();

        expect(await passwordResetPage.findServerAlert()).toHaveTextContent(
          testI18n.t("auth.passwordReset.linkInvalid"),
        );
        expect(passwordResetPage.getRequestNewLink()).toHaveAttribute(
          "href",
          ROUTE_PATH.AUTH.PASSWORD_RECOVERY,
        );
        expect(passwordResetPage.queryNewPasswordInput()).toBeNull();
      },
    );

    it("AC-KAN-37-05: a link without code shows linkInvalid and never asks Firebase", async () => {
      const passwordResetPage = renderPasswordResetPage(
        ROUTE_PATH.AUTH.PASSWORD_RESET,
      );

      expect(await passwordResetPage.findServerAlert()).toHaveTextContent(
        testI18n.t("auth.passwordReset.linkInvalid"),
      );
      expect(verifyResetCode).not.toHaveBeenCalled();
      expect(passwordResetPage.queryNewPasswordInput()).toBeNull();
    });

    it("AC-KAN-37-05: a link of another action mode shows linkInvalid", async () => {
      const passwordResetPage = renderPasswordResetPage(
        resetPath({
          [SEARCH_PARAM.MODE]: "verifyEmail",
          [SEARCH_PARAM.OOB_CODE]: OOB_CODE,
        }),
      );

      expect(await passwordResetPage.findServerAlert()).toHaveTextContent(
        testI18n.t("auth.passwordReset.linkInvalid"),
      );
      expect(verifyResetCode).not.toHaveBeenCalled();
    });

    it("AC-KAN-37-05: a link that expires while the user types shows linkInvalid on save", async () => {
      vi.mocked(confirmNewPassword).mockRejectedValue(
        new FirebaseError(
          FIREBASE_ERROR_CODE.EXPIRED_ACTION_CODE,
          FIREBASE_ERROR_CODE.EXPIRED_ACTION_CODE,
        ),
      );
      const passwordResetPage = renderPasswordResetPage();
      await screen.findByLabelText(
        testI18n.t("auth.passwordReset.newPasswordLabel"),
      );

      await fillValidForm(passwordResetPage);
      await passwordResetPage.submit();

      expect(await passwordResetPage.findServerAlert()).toHaveTextContent(
        testI18n.t("auth.passwordReset.linkInvalid"),
      );
      expect(passwordResetPage.queryNewPasswordInput()).toBeNull();
    });

    it("AC-KAN-37-06: a network failure saves nothing, shows the error and keeps the page", async () => {
      vi.mocked(confirmNewPassword).mockRejectedValue(
        new FirebaseError(
          FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
          FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
        ),
      );
      const passwordResetPage = renderPasswordResetPage();
      await screen.findByLabelText(
        testI18n.t("auth.passwordReset.newPasswordLabel"),
      );

      await fillValidForm(passwordResetPage);
      await passwordResetPage.submit();

      expect(await passwordResetPage.findServerAlert()).toHaveTextContent(
        testI18n.t("errors.network"),
      );
      expect(passwordResetPage.getNewPasswordInput()).toHaveValue(
        STRONG_PASSWORD,
      );
    });

    it("a network failure while checking the link offers to try again", async () => {
      rejectLinkCheckWith(FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED);
      const passwordResetPage = renderPasswordResetPage();

      expect(await passwordResetPage.findServerAlert()).toHaveTextContent(
        testI18n.t("errors.network"),
      );

      vi.mocked(verifyResetCode).mockResolvedValue(ACCOUNT_EMAIL);
      await passwordResetPage.clickRetry();

      expect(
        await screen.findByLabelText(
          testI18n.t("auth.passwordReset.newPasswordLabel"),
        ),
      ).toBeInTheDocument();
    });

    it("AS-1: masks both passwords before the request is sent", async () => {
      const passwordResetPage = renderPasswordResetPage();
      await screen.findByLabelText(
        testI18n.t("auth.passwordReset.newPasswordLabel"),
      );
      const typeAttributesAtSend: Nullable<string>[] = [];
      vi.mocked(confirmNewPassword).mockImplementation(() => {
        typeAttributesAtSend.push(
          passwordResetPage.getNewPasswordInput().getAttribute("type"),
          passwordResetPage.getConfirmationInput().getAttribute("type"),
        );
        return Promise.resolve();
      });

      await fillValidForm(passwordResetPage);
      await passwordResetPage.toggleBothPasswords();
      expect(passwordResetPage.getNewPasswordInput()).toHaveAttribute(
        "type",
        "text",
      );
      await passwordResetPage.submit();

      await screen.findByRole(
        "heading",
        { level: 1, name: testI18n.t("auth.signIn.title") },
        { timeout: LAZY_PAGE_TIMEOUT_MS },
      );
      expect(typeAttributesAtSend).toEqual(["password", "password"]);
    });
  });
});
