import { screen } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
import {
  createAcceptInvitationPage,
  type AcceptInvitationPageObject,
} from "./AcceptInvitationPage.page";
import { acceptCollaboratorInvitation } from "../api/acceptCollaboratorInvitation";
import { validateCollaboratorInvitation } from "../api/validateCollaboratorInvitation";
import { authRoutes } from "../auth.routes";
import { ACCEPT_INVITATION_REASON } from "../constants/AcceptInvitation.constants";

vi.mock("../api/validateCollaboratorInvitation");
vi.mock("../api/acceptCollaboratorInvitation");

const LAZY_PAGE_TIMEOUT_MS = 4_000;
const INVITATION_TOKEN = "valid-invite-token";
const BUSINESS_NAME = "Barberia Central";
const COLLABORATOR_EMAIL = "camila@salon.com";
const STRONG_PASSWORD = "Emulator-Only-123!";

const buildInvitationPath = (token?: string): string =>
  token
    ? `${ROUTE_PATH.AUTH.ACCEPT_INVITATION}?${new URLSearchParams({ [SEARCH_PARAM.TOKEN]: token }).toString()}`
    : ROUTE_PATH.AUTH.ACCEPT_INVITATION;

const renderAcceptInvitationPage = (
  initialPath: string = buildInvitationPath(INVITATION_TOKEN),
): AcceptInvitationPageObject => {
  renderRoutesWithProviders(authRoutes, {
    initialPath,
    session: SIGNED_OUT_SESSION,
  });
  return createAcceptInvitationPage();
};

describe("AcceptInvitationPage (KAN-79)", () => {
  beforeEach(() => {
    vi.mocked(validateCollaboratorInvitation).mockResolvedValue({
      businessName: BUSINESS_NAME,
      email: COLLABORATOR_EMAIL,
    });
    vi.mocked(acceptCollaboratorInvitation).mockResolvedValue({
      email: COLLABORATOR_EMAIL,
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    if (testI18n.language !== LANGUAGE.ES) {
      await testI18n.changeLanguage(LANGUAGE.ES);
    }
  });

  it("AC-KAN-79-02: displays business context and password form for a valid token", async () => {
    const page = renderAcceptInvitationPage();

    await page.findTitle();
    expect(
      await page.findBusinessContext(BUSINESS_NAME, COLLABORATOR_EMAIL),
    ).toBeInTheDocument();
    expect(page.getNewPasswordInput()).toBeInTheDocument();
  });

  it("AC-KAN-79-03: activates account, shows success and redirects to sign-in with email prefilled", async () => {
    const toastSuccess = vi.spyOn(toast, "success");
    const page = renderAcceptInvitationPage();
    await page.findBusinessContext(BUSINESS_NAME, COLLABORATOR_EMAIL);

    await page.typeNewPassword(STRONG_PASSWORD);
    await page.typeConfirmation(STRONG_PASSWORD);
    await page.submit();

    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: testI18n.t("auth.signIn.title") },
        { timeout: LAZY_PAGE_TIMEOUT_MS },
      ),
    ).toBeInTheDocument();
    expect(acceptCollaboratorInvitation).toHaveBeenCalledWith({
      invitationToken: INVITATION_TOKEN,
      password: STRONG_PASSWORD,
      recaptchaToken: "",
    });
    expect(toastSuccess).toHaveBeenCalledWith(
      testI18n.t("auth.invitation.success"),
    );
    expect(
      screen.getByLabelText(testI18n.t("auth.signIn.emailLabel")),
    ).toHaveValue(COLLABORATOR_EMAIL);
  });

  it("AC-KAN-79-05: shows linkInvalid and hides form when token is missing or rejected", async () => {
    const pageWithoutToken = renderAcceptInvitationPage(buildInvitationPath());
    expect(await pageWithoutToken.findServerAlert()).toHaveTextContent(
      testI18n.t("auth.invitation.linkInvalid"),
    );
    expect(pageWithoutToken.queryNewPasswordInput()).toBeNull();
    expect(validateCollaboratorInvitation).not.toHaveBeenCalled();
  });

  it("AC-KAN-79-05: shows linkInvalid when server reports invitation_invalid", async () => {
    const invalidError = new FirebaseError(
      FIREBASE_ERROR_CODE.FAILED_PRECONDITION,
      "Invalid invitation",
    ) as FirebaseError & { details?: Record<string, unknown> };
    invalidError.details = {
      reason: ACCEPT_INVITATION_REASON.INVITATION_INVALID,
    };
    vi.mocked(validateCollaboratorInvitation).mockRejectedValueOnce(
      invalidError,
    );

    const page = renderAcceptInvitationPage();
    expect(await page.findServerAlert()).toHaveTextContent(
      testI18n.t("auth.invitation.linkInvalid"),
    );
    expect(page.getSignInLink()).toHaveAttribute(
      "href",
      ROUTE_PATH.AUTH.SIGN_IN,
    );
    expect(page.queryNewPasswordInput()).toBeNull();
  });

  it("AC-KAN-79-06: validates weak password and mismatch without submitting", async () => {
    const page = renderAcceptInvitationPage();
    await page.findBusinessContext(BUSINESS_NAME, COLLABORATOR_EMAIL);

    await page.typeNewPassword("weak");
    await page.typeConfirmation("different");
    await page.submit();

    expect(
      page.queryFieldErrors(VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK),
    ).toHaveLength(1);
    expect(
      page.queryFieldErrors(VALIDATION_MESSAGE_KEY.PASSWORD_MISMATCH),
    ).toHaveLength(1);
    expect(acceptCollaboratorInvitation).not.toHaveBeenCalled();
  });

  it("AC-KAN-79-08: shows emailAlreadyInUse when server returns cannot_accept_invitation", async () => {
    const emailTakenError = new FirebaseError(
      FIREBASE_ERROR_CODE.FAILED_PRECONDITION,
      "Cannot accept",
    ) as FirebaseError & { details?: Record<string, unknown> };
    emailTakenError.details = {
      reason: ACCEPT_INVITATION_REASON.CANNOT_ACCEPT_INVITATION,
    };
    vi.mocked(acceptCollaboratorInvitation).mockRejectedValueOnce(
      emailTakenError,
    );

    const page = renderAcceptInvitationPage();
    await page.findBusinessContext(BUSINESS_NAME, COLLABORATOR_EMAIL);

    await page.typeNewPassword(STRONG_PASSWORD);
    await page.typeConfirmation(STRONG_PASSWORD);
    await page.submit();

    expect(await page.findServerAlert()).toHaveTextContent(
      testI18n.t("auth.invitation.emailAlreadyInUse"),
    );
  });

  it("AC-KAN-79-07: offers retry on network error while validating token", async () => {
    vi.mocked(validateCollaboratorInvitation).mockRejectedValueOnce(
      new FirebaseError(
        FIREBASE_ERROR_CODE.FUNCTIONS_UNAVAILABLE,
        "Network down",
      ),
    );

    const page = renderAcceptInvitationPage();
    expect(await page.findServerAlert()).toHaveTextContent(
      testI18n.t("errors.network"),
    );

    vi.mocked(validateCollaboratorInvitation).mockResolvedValueOnce({
      businessName: BUSINESS_NAME,
      email: COLLABORATOR_EMAIL,
    });
    await page.clickRetry();

    expect(
      await page.findBusinessContext(BUSINESS_NAME, COLLABORATOR_EMAIL),
    ).toBeInTheDocument();
  });
});
