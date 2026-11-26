import { screen, waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { FIREBASE_ERROR_CODE, ROUTE_PATH, SEARCH_PARAM } from "@/constants";
import type { Session } from "@/modules/auth";
import { renderRoutesWithProviders } from "@/test-utils/renderRoutesWithProviders";
import {
  CUSTOMER_SESSION,
  SIGNED_OUT_SESSION,
} from "@/test-utils/sessionFixtures";
import { testI18n } from "@/test-utils/testI18n";
import {
  createAuthActionPage,
  type AuthActionPageObject,
} from "./AuthActionPage.page";
import { applyEmailVerificationCode } from "../api/applyEmailVerificationCode";
import { verifyResetCode } from "../api/verifyResetCode";
import { authRoutes } from "../auth.routes";
import { AUTH_ACTION_MODE } from "../constants/AuthAction.constants";
import { buildSignInPath } from "../utils/buildSignInPath";

vi.mock("../api/applyEmailVerificationCode");
vi.mock("../api/verifyResetCode");

const OOB_CODE = "valid-oob-code";
const BUSINESS_PATH = "/barberia-centro";

const actionPath = (searchParameters: Record<string, string>): string =>
  `${ROUTE_PATH.AUTH.ACTION}?${new URLSearchParams(searchParameters).toString()}`;

const VERIFY_LINK_PATH = actionPath({
  [SEARCH_PARAM.MODE]: AUTH_ACTION_MODE.VERIFY_EMAIL,
  [SEARCH_PARAM.OOB_CODE]: OOB_CODE,
});

const renderAuthActionPage = (
  initialPath: string = VERIFY_LINK_PATH,
  session: Session = SIGNED_OUT_SESSION,
): AuthActionPageObject & {
  readonly router: ReturnType<typeof renderRoutesWithProviders>["router"];
} => {
  const { router } = renderRoutesWithProviders(authRoutes, {
    initialPath,
    session,
  });
  return { ...createAuthActionPage(), router };
};

const rejectVerificationWith = (errorCode: string): void => {
  vi.mocked(applyEmailVerificationCode).mockRejectedValue(
    new FirebaseError(errorCode, errorCode),
  );
};

describe("AuthActionPage", () => {
  beforeEach(() => {
    vi.mocked(applyEmailVerificationCode).mockResolvedValue();
    vi.mocked(verifyResetCode).mockResolvedValue("cliente@demo.test");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("KAN-126: verify my email", () => {
    it("AC-KAN-126-02: a valid link verifies the email once and offers sign-in", async () => {
      const authActionPage = renderAuthActionPage();

      await authActionPage.findTitle();
      expect(await authActionPage.findSuccess()).toBeInTheDocument();
      expect(applyEmailVerificationCode).toHaveBeenCalledTimes(1);
      expect(applyEmailVerificationCode).toHaveBeenCalledWith(OOB_CODE);
      expect(await authActionPage.findSignInLink()).toHaveAttribute(
        "href",
        ROUTE_PATH.AUTH.SIGN_IN,
      );
    });

    it("AC-KAN-126-02: the link works with a session open (no GuestOnly redirect)", async () => {
      const authActionPage = renderAuthActionPage(
        VERIFY_LINK_PATH,
        CUSTOMER_SESSION,
      );

      expect(await authActionPage.findSuccess()).toBeInTheDocument();
      expect(authActionPage.router.state.location.pathname).toBe(
        ROUTE_PATH.AUTH.ACTION,
      );
    });

    it("AC-KAN-126-02 / AC-KAN-127-03: sign-in brings the customer back to the continueUrl of this site", async () => {
      const authActionPage = renderAuthActionPage(
        actionPath({
          [SEARCH_PARAM.CONTINUE_URL]: `${window.location.origin}${BUSINESS_PATH}`,
          [SEARCH_PARAM.MODE]: AUTH_ACTION_MODE.VERIFY_EMAIL,
          [SEARCH_PARAM.OOB_CODE]: OOB_CODE,
        }),
      );

      expect(await authActionPage.findSignInLink()).toHaveAttribute(
        "href",
        buildSignInPath(BUSINESS_PATH),
      );
    });

    it("AC-KAN-126-02: a continueUrl of another site is ignored (no open redirect)", async () => {
      const authActionPage = renderAuthActionPage(
        actionPath({
          [SEARCH_PARAM.CONTINUE_URL]: "https://sitio-ajeno.test/robar",
          [SEARCH_PARAM.MODE]: AUTH_ACTION_MODE.VERIFY_EMAIL,
          [SEARCH_PARAM.OOB_CODE]: OOB_CODE,
        }),
      );

      expect(await authActionPage.findSignInLink()).toHaveAttribute(
        "href",
        ROUTE_PATH.AUTH.SIGN_IN,
      );
    });

    it.each([
      ["expired", FIREBASE_ERROR_CODE.EXPIRED_ACTION_CODE],
      ["already used or malformed", FIREBASE_ERROR_CODE.INVALID_ACTION_CODE],
      ["of a disabled account", FIREBASE_ERROR_CODE.USER_DISABLED],
      ["of a deleted account", FIREBASE_ERROR_CODE.USER_NOT_FOUND],
    ])(
      "AC-KAN-126-03: a %s link shows linkInvalid and the way to sign in for a new email",
      async (_caseName, errorCode) => {
        rejectVerificationWith(errorCode);
        const authActionPage = renderAuthActionPage();

        expect(await authActionPage.findAlert()).toHaveTextContent(
          testI18n.t("auth.emailVerification.linkInvalid"),
        );
        expect(await authActionPage.findSignInLink()).toHaveAttribute(
          "href",
          ROUTE_PATH.AUTH.SIGN_IN,
        );
        expect(
          screen.queryByText(testI18n.t("auth.emailVerification.success")),
        ).toBeNull();
      },
    );

    it("AC-KAN-126-03: a link without code shows linkInvalid and never asks Firebase", async () => {
      const authActionPage = renderAuthActionPage(
        actionPath({ [SEARCH_PARAM.MODE]: AUTH_ACTION_MODE.VERIFY_EMAIL }),
      );

      expect(await authActionPage.findAlert()).toHaveTextContent(
        testI18n.t("auth.emailVerification.linkInvalid"),
      );
      expect(applyEmailVerificationCode).not.toHaveBeenCalled();
    });

    it("AC-KAN-126-03: a link of an unknown action mode shows linkInvalid and applies nothing", async () => {
      const authActionPage = renderAuthActionPage(
        actionPath({
          [SEARCH_PARAM.MODE]: "recoverEmail",
          [SEARCH_PARAM.OOB_CODE]: OOB_CODE,
        }),
      );

      expect(await authActionPage.findAlert()).toHaveTextContent(
        testI18n.t("auth.emailVerification.linkInvalid"),
      );
      expect(applyEmailVerificationCode).not.toHaveBeenCalled();
    });

    it("AC-KAN-126-03: a network failure shows the error and verifies after retrying", async () => {
      rejectVerificationWith(FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED);
      const authActionPage = renderAuthActionPage();

      expect(await authActionPage.findAlert()).toHaveTextContent(
        testI18n.t("errors.network"),
      );

      vi.mocked(applyEmailVerificationCode).mockResolvedValue();
      await authActionPage.clickRetry();

      expect(await authActionPage.findSuccess()).toBeInTheDocument();
      expect(applyEmailVerificationCode).toHaveBeenCalledTimes(2);
    });

    it("AC-KAN-126-03: an unexpected failure shows errors.unknown with retry", async () => {
      rejectVerificationWith("auth/internal-error");
      const authActionPage = renderAuthActionPage();

      expect(await authActionPage.findAlert()).toHaveTextContent(
        testI18n.t("errors.unknown"),
      );
    });
  });

  describe("US-36: the reset link goes on to its own page", () => {
    it("AC-KAN-37-01: a resetPassword link opens /password-reset with the same query", async () => {
      const resetLinkSearch = new URLSearchParams({
        [SEARCH_PARAM.MODE]: AUTH_ACTION_MODE.RESET_PASSWORD,
        [SEARCH_PARAM.OOB_CODE]: OOB_CODE,
      }).toString();
      const { router } = renderAuthActionPage(
        `${ROUTE_PATH.AUTH.ACTION}?${resetLinkSearch}`,
      );

      await waitFor(() => {
        expect(router.state.location.pathname).toBe(
          ROUTE_PATH.AUTH.PASSWORD_RESET,
        );
      });
      expect(router.state.location.search).toBe(`?${resetLinkSearch}`);
      await waitFor(() => {
        expect(verifyResetCode).toHaveBeenCalledWith(OOB_CODE);
      });
      expect(applyEmailVerificationCode).not.toHaveBeenCalled();
    });
  });
});
