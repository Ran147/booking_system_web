import { screen, waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import type { ReactElement } from "react";
import type * as commonComponents from "@/components/common";
import { toast, type RecaptchaFieldProps } from "@/components/common";
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
  SIGNED_OUT_SESSION,
} from "@/test-utils/sessionFixtures";
import { testI18n } from "@/test-utils/testI18n";
import {
  createAcceptInvitationPage,
  type AcceptInvitationPageObject,
} from "./AcceptInvitationPage.page";
import type * as invitationClient from "../api/invitationClient";
import {
  acceptCollaboratorInvitation,
  validateCollaboratorInvitation,
} from "../api/invitationClient";
import { authRoutes } from "../auth.routes";

vi.mock("../api/invitationClient", async (importOriginal) => {
  const original = await importOriginal<typeof invitationClient>();
  return {
    ...original,
    acceptCollaboratorInvitation: vi.fn(),
    validateCollaboratorInvitation: vi.fn(),
  };
});

vi.mock("@/components/common", async (importOriginal) => {
  const original = await importOriginal<typeof commonComponents>();
  return {
    ...original,
    RecaptchaField: ({ onTokenChange }: RecaptchaFieldProps): ReactElement => (
      <button
        onClick={(): void => {
          onTokenChange("mock-recaptcha-token");
        }}
        type="button"
      >
        Complete reCAPTCHA
      </button>
    ),
  };
});

const LAZY_TIMEOUT_MS = 4_000;
const INVITATION_TOKEN = "token-invitacion-valido";
const VALID_PATH = `${ROUTE_PATH.AUTH.ACCEPT_INVITATION}?${SEARCH_PARAM.TOKEN}=${INVITATION_TOKEN}`;
const STRONG_PASSWORD = "Emulator-Only-123!";

const renderAcceptInvitation = (
  initialPath: string = VALID_PATH,
): AcceptInvitationPageObject => {
  renderRoutesWithProviders(
    [
      ...authRoutes,
      { element: <div>Sign In Target</div>, path: ROUTE_PATH.AUTH.SIGN_IN },
      { element: <div>Business Portal</div>, path: ROUTE_PATH.BUSINESS.ROOT },
    ],
    {
      initialPath,
      session: SIGNED_OUT_SESSION,
    },
  );
  return createAcceptInvitationPage();
};

describe("AcceptInvitationPage", () => {
  beforeEach(() => {
    vi.mocked(validateCollaboratorInvitation).mockResolvedValue({
      businessName: "Barberia Central",
      email: "carlos@barberia.test",
    });
    vi.mocked(acceptCollaboratorInvitation).mockResolvedValue({
      email: "carlos@barberia.test",
      status: "active",
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    if (testI18n.language !== LANGUAGE.ES) {
      await testI18n.changeLanguage(LANGUAGE.ES);
    }
  });

  it("KAN-79: AC-KAN-79-01 validates the token and completes collaborator onboarding with reCAPTCHA and strong password", async () => {
    const toastSpy = vi.spyOn(toast, "success");
    const pageObject = renderAcceptInvitation();

    await pageObject.findTitle();
    await screen.findByText(
      /Barberia Central/i,
      {},
      { timeout: LAZY_TIMEOUT_MS },
    );
    expect(pageObject.getSubmitButton()).toBeDisabled();

    await pageObject.typePassword(STRONG_PASSWORD);
    await pageObject.typeConfirmation(STRONG_PASSWORD);
    await pageObject.completeRecaptcha();

    expect(pageObject.getSubmitButton()).toBeEnabled();
    await pageObject.submit();

    await waitFor(() => {
      expect(acceptCollaboratorInvitation).toHaveBeenCalledWith({
        invitationToken: INVITATION_TOKEN,
        password: STRONG_PASSWORD,
        recaptchaToken: "mock-recaptcha-token",
      });
    });
    expect(toastSpy).toHaveBeenCalledWith(
      testI18n.t("auth.invitation.success"),
    );
    await screen.findByRole(
      "heading",
      { name: testI18n.t("auth.signIn.title") },
      { timeout: LAZY_TIMEOUT_MS },
    );
  }, 10_000);

  it("KAN-79: AC-KAN-79-02 rejects password mismatch without submitting", async () => {
    const pageObject = renderAcceptInvitation();
    await pageObject.findTitle();
    await screen.findByLabelText(
      testI18n.t("auth.invitation.newPasswordLabel"),
    );

    await pageObject.typePassword(STRONG_PASSWORD);
    await pageObject.typeConfirmation("Different-Pass-1!");
    await pageObject.completeRecaptcha();
    await pageObject.submit();

    await screen.findByText(
      testI18n.t(`validation:${VALIDATION_MESSAGE_KEY.PASSWORD_MISMATCH}`),
    );
    expect(acceptCollaboratorInvitation).not.toHaveBeenCalled();
  });

  it("KAN-79: AC-KAN-79-02 shows invalid link state when invitation token is missing", async () => {
    const invalidPage = renderAcceptInvitation(
      ROUTE_PATH.AUTH.ACCEPT_INVITATION,
    );
    await invalidPage.findTitle();
    await screen.findByText(testI18n.t("auth.invitation.linkInvalid"));
    expect(invalidPage.querySubmitButton()).not.toBeInTheDocument();
  });

  it("KAN-79: AC-KAN-79-03 shows invalid link error when token is expired or used", async () => {
    vi.mocked(validateCollaboratorInvitation).mockRejectedValue(
      new FirebaseError(
        FIREBASE_ERROR_CODE.FAILED_PRECONDITION,
        "expired_invitation",
      ),
    );

    const expiredPage = renderAcceptInvitation();
    await expiredPage.findTitle();
    await screen.findByText(testI18n.t("auth.invitation.linkInvalid"));
  });

  it("KAN-79: AC-KAN-79-04 redirects already signed-in collaborators to the business portal", async () => {
    renderRoutesWithProviders(
      [
        ...authRoutes,
        { element: <div>Business Home</div>, path: ROUTE_PATH.BUSINESS.ROOT },
      ],
      {
        initialPath: VALID_PATH,
        session: COLLABORATOR_SESSION,
      },
    );
    await screen.findByText("Business Home", {}, { timeout: LAZY_TIMEOUT_MS });
  });
});
