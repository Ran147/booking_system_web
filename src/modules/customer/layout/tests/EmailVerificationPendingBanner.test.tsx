import { screen } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { sendEmailVerification } from "firebase/auth";
import { FIREBASE_ERROR_CODE } from "@/constants";
import type { Session } from "@/modules/auth";
import { renderRoutesWithProviders } from "@/test-utils/renderRoutesWithProviders";
import {
  CUSTOMER_SESSION,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
} from "@/test-utils/sessionFixtures";
import { testI18n } from "@/test-utils/testI18n";
import type { Nullable } from "@/types";
import {
  createEmailVerificationPendingBannerPage,
  type EmailVerificationPendingBannerPageObject,
} from "./EmailVerificationPendingBanner.page";
import { EmailVerificationPendingBanner } from "../components";

const testAuth = vi.hoisted(() => ({
  currentUser: null as Nullable<{ emailVerified: boolean }>,
  languageCode: null as Nullable<string>,
}));

vi.mock("@/services/firebase", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  auth: testAuth,
}));
vi.mock("firebase/auth", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  sendEmailVerification: vi.fn(),
}));

const BUSINESS_SLUG = "barberia-centro";

const renderBanner = (
  session: Session = CUSTOMER_SESSION,
): EmailVerificationPendingBannerPageObject => {
  renderRoutesWithProviders(
    [{ element: <EmailVerificationPendingBanner />, path: "/:businessSlug" }],
    { initialPath: `/${BUSINESS_SLUG}`, session },
  );
  return createEmailVerificationPendingBannerPage();
};

const rejectResendWith = (errorCode: string): void => {
  vi.mocked(sendEmailVerification).mockRejectedValue(
    new FirebaseError(errorCode, errorCode),
  );
};

describe("EmailVerificationPendingBanner (KAN-126)", () => {
  beforeEach(() => {
    testAuth.currentUser = { emailVerified: false };
    testAuth.languageCode = null;
    vi.mocked(sendEmailVerification).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.mocked(sendEmailVerification).mockReset();
  });

  it("AC-KAN-126-06: a signed-in customer with an unverified email sees the notice with a resend action", async () => {
    const bannerPage = renderBanner();

    expect(await bannerPage.findPendingMessage()).toBeInTheDocument();
    expect(bannerPage.getResendButton()).toBeEnabled();
  });

  it("AC-KAN-126-06: a verified customer sees no notice", () => {
    testAuth.currentUser = { emailVerified: true };
    const bannerPage = renderBanner();

    expect(bannerPage.queryPendingMessage()).toBeNull();
  });

  it.each([
    ["a visitor", SIGNED_OUT_SESSION],
    ["a subscriber", SUBSCRIBER_SESSION],
  ] as const)("shows no notice to %s", (_label, session) => {
    const bannerPage = renderBanner(session);

    expect(bannerPage.queryPendingMessage()).toBeNull();
  });

  it("AC-KAN-126-04: resend sends a new email that returns to the business, in the active language", async () => {
    const bannerPage = renderBanner();
    await bannerPage.findPendingMessage();

    await bannerPage.clickResend();

    expect(
      await screen.findByText(testI18n.t("customer:signUp.verification.sent")),
    ).toBeInTheDocument();
    expect(sendEmailVerification).toHaveBeenCalledTimes(1);
    expect(sendEmailVerification).toHaveBeenCalledWith(testAuth.currentUser, {
      url: `${window.location.origin}/${BUSINESS_SLUG}`,
    });
    expect(testAuth.languageCode).toBe(testI18n.resolvedLanguage);
  });

  it("AC-KAN-126-05: when Firebase's resend limit is reached tooManyRequests is shown", async () => {
    rejectResendWith(FIREBASE_ERROR_CODE.TOO_MANY_REQUESTS);
    const bannerPage = renderBanner();
    await bannerPage.findPendingMessage();

    await bannerPage.clickResend();

    expect(
      await screen.findByText(
        testI18n.t("customer:signUp.verification.tooManyRequests"),
      ),
    ).toBeInTheDocument();
  });

  it("a network failure shows errors.network", async () => {
    rejectResendWith(FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED);
    const bannerPage = renderBanner();
    await bannerPage.findPendingMessage();

    await bannerPage.clickResend();

    expect(
      await screen.findByText(testI18n.t("common:errors.network")),
    ).toBeInTheDocument();
  });

  it("any other failure shows errors.unknown", async () => {
    rejectResendWith(FIREBASE_ERROR_CODE.UNKNOWN);
    const bannerPage = renderBanner();
    await bannerPage.findPendingMessage();

    await bannerPage.clickResend();

    expect(
      await screen.findByText(testI18n.t("common:errors.unknown")),
    ).toBeInTheDocument();
  });
});
