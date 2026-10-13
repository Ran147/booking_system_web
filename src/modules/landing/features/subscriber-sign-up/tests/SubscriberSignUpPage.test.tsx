import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  signInWithCustomToken,
  signInWithEmailAndPassword,
} from "firebase/auth";
import type { ReactElement } from "react";
import { useLocation, useNavigate, type RouteObject } from "react-router";
import type { Session, SignInLocationState } from "@/modules/auth";
import { landingRoutes } from "@/modules/landing/landing.routes";
import { ARIA_ROLE, FUNCTION_NAME, ROUTE_PATH } from "@/shared/constants";
import { callFunction } from "@/shared/lib/firebase";
import {
  CUSTOMER_SESSION,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  SUPER_ADMIN_SESSION,
  renderRoutesWithProviders,
  testI18n,
} from "@/shared/test-utils";
import type { Nullable } from "@/shared/types";
import { createSubscriberSignUpFormPage } from "./SubscriberSignUpForm.page";
import {
  SIGN_UP_TEST_EMAIL,
  SIGN_UP_TEST_TOKEN,
  buildSignUpFunctionError,
  mockSignUpFunctions,
} from "./signUpFunctionMocks";
import { SIGN_UP_ERROR_REASON } from "../constants/SubscriberSignUpServer.constants";

vi.mock("@/services/firebase/callFunction", () => ({ callFunction: vi.fn() }));
// Spies on the only ways the browser could start a session (AC-KAN-27-02).
vi.mock("firebase/auth", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  signInWithCustomToken: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}));
vi.mock("@/components/common/recaptcha-field", async () => ({
  RecaptchaField: (await import("./recaptchaFieldDouble")).RecaptchaFieldDouble,
}));

const STRONG_PASSWORD = "Reserva!2026";
const SIGN_UP_PATH = `${ROUTE_PATH.LANDING.SIGN_UP}?token=${SIGN_UP_TEST_TOKEN}`;

const BACK_ACTION = "back";

// Stand-in for the sign-in page: shows the email the sign-up sent (KAN-27)
// and a back button like the browser's (AC-KAN-27-05).
const SignInStub = (): ReactElement => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signUpEmail } = location.state as SignInLocationState;
  return (
    <>
      <p>{`sign-in for ${signUpEmail}`}</p>
      <button onClick={() => void navigate(-1)} type="button">
        {BACK_ACTION}
      </button>
    </>
  );
};

// Stand-in for the business and admin portals: shows where GuestOnly sent a
// signed-in user (AC-KAN-27-04).
const PortalStub = (): ReactElement => {
  const location = useLocation();
  return <p>{`portal ${location.pathname}`}</p>;
};

const testRoutes: RouteObject[] = [
  ...landingRoutes,
  { element: <SignInStub />, path: ROUTE_PATH.AUTH.SIGN_IN },
  { element: <PortalStub />, path: ROUTE_PATH.BUSINESS.ROOT },
  { element: <PortalStub />, path: ROUTE_PATH.ADMIN.ROOT },
];

const renderSignUpPage = (
  initialPath: string = SIGN_UP_PATH,
  session: Session = SIGNED_OUT_SESSION,
): void => {
  renderRoutesWithProviders(testRoutes, { initialPath, session });
};

const fillAndSubmitSignUp = async (): Promise<void> => {
  await screen.findByText("Básico");
  const signUpPage = createSubscriberSignUpFormPage();
  await signUpPage.typeInto("firstName", "Ana");
  await signUpPage.typeInto("lastName", "Pérez");
  await signUpPage.typeInto("password", STRONG_PASSWORD);
  await signUpPage.typeInto("passwordConfirmation", STRONG_PASSWORD);
  await signUpPage.typeInto("businessName", "Barbería Centro");
  await signUpPage.solveRecaptcha();
  await signUpPage.clickSubmit();
};

const countCompleteSignUpCalls = (): number =>
  vi
    .mocked(callFunction)
    .mock.calls.filter(
      ([functionName]) =>
        functionName === FUNCTION_NAME.COMPLETE_SUBSCRIBER_SIGN_UP,
    ).length;

const queryForm = (): Nullable<HTMLElement> =>
  screen.queryByRole(ARIA_ROLE.BUTTON, {
    name: testI18n.t("landing:subscriberSignUp.form.submitAction"),
  });

describe("SubscriberSignUpPage (KAN-25, KAN-27)", () => {
  beforeEach(() => {
    vi.mocked(callFunction).mockReset();
    mockSignUpFunctions();
  });

  it("KAN-25: AC-KAN-25-14 shows the paid plan and the checkout email for a valid link", async () => {
    renderSignUpPage();

    expect(await screen.findByText("Básico")).toBeInTheDocument();
    expect(
      screen.getByText(testI18n.t("landing:subscriberSignUp.plan.title")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        testI18n.t("landing:subscriberSignUp.plan.billingPeriod.monthly"),
      ),
    ).toBeInTheDocument();
    expect(createSubscriberSignUpFormPage().getField("email")).toHaveValue(
      SIGN_UP_TEST_EMAIL,
    );
    expect(callFunction).toHaveBeenCalledWith("validateSignUpLink", {
      signUpToken: SIGN_UP_TEST_TOKEN,
    });
  });

  it("KAN-25: AC-KAN-25-21 explains that sign-up starts with a plan when there is no link", async () => {
    renderSignUpPage(ROUTE_PATH.LANDING.SIGN_UP);

    expect(
      await screen.findByText(
        testI18n.t("landing:subscriberSignUp.link.missing"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: testI18n.t("landing:subscriberSignUp.link.plansAction"),
      }),
    ).toHaveAttribute("href", ROUTE_PATH.LANDING.PLANS);
    expect(queryForm()).not.toBeInTheDocument();
    expect(callFunction).not.toHaveBeenCalled();
  });

  it("KAN-25: AC-KAN-25-20 shows no form for a used or unknown link", async () => {
    mockSignUpFunctions({
      validateSignUpLink: async () => {
        throw buildSignUpFunctionError(
          "failed-precondition",
          SIGN_UP_ERROR_REASON.LINK_INVALID,
        );
      },
    });
    renderSignUpPage();

    expect(
      await screen.findByText(
        testI18n.t("landing:subscriberSignUp.link.invalid"),
      ),
    ).toBeInTheDocument();
    expect(queryForm()).not.toBeInTheDocument();
  });

  it("KAN-25: AC-KAN-25-20 shows no form and offers contact for an expired link", async () => {
    mockSignUpFunctions({
      validateSignUpLink: async () => {
        throw buildSignUpFunctionError(
          "failed-precondition",
          SIGN_UP_ERROR_REASON.LINK_EXPIRED,
        );
      },
    });
    renderSignUpPage();

    expect(
      await screen.findByText(
        testI18n.t("landing:subscriberSignUp.link.expired"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: testI18n.t("landing:subscriberSignUp.link.contactAction"),
      }),
    ).toHaveAttribute("href", ROUTE_PATH.LANDING.CONTACT);
    expect(queryForm()).not.toBeInTheDocument();
  });

  it("KAN-25: retries the link check after a server failure", async () => {
    mockSignUpFunctions({
      validateSignUpLink: async () => {
        throw buildSignUpFunctionError("internal");
      },
    });
    renderSignUpPage();
    expect(
      await screen.findByText(testI18n.t("common:errors.unknown")),
    ).toBeInTheDocument();

    mockSignUpFunctions();
    await userEvent.click(
      screen.getByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("landing:subscriberSignUp.link.retryAction"),
      }),
    );

    expect(await screen.findByText("Básico")).toBeInTheDocument();
  });

  it("KAN-27: AC-KAN-27-01 takes the visitor to sign-in with the new email after the sign-up", async () => {
    renderSignUpPage();

    await fillAndSubmitSignUp();

    await waitFor(() => {
      expect(
        screen.getByText(`sign-in for ${SIGN_UP_TEST_EMAIL}`),
      ).toBeInTheDocument();
    });
  });

  it("KAN-27: AC-KAN-27-02 does not sign the new account in: the visitor reaches sign-in signed out", async () => {
    renderSignUpPage();

    await fillAndSubmitSignUp();

    expect(
      await screen.findByText(`sign-in for ${SIGN_UP_TEST_EMAIL}`),
    ).toBeInTheDocument();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    expect(signInWithCustomToken).not.toHaveBeenCalled();
  });

  it.each([
    [
      "the email already has an account (AC-KAN-25-09)",
      "already-exists",
      SIGN_UP_ERROR_REASON.ACCOUNT_EXISTS,
    ],
    ["the network fails (AC-KAN-25-10)", "internal", undefined],
  ] as const)(
    "KAN-27: AC-KAN-27-03 stays on the form when %s",
    async (_caseName, errorCode, errorReason) => {
      mockSignUpFunctions({
        completeSubscriberSignUp: async () => {
          throw buildSignUpFunctionError(errorCode, errorReason);
        },
      });
      renderSignUpPage();

      await fillAndSubmitSignUp();

      expect(await screen.findByRole(ARIA_ROLE.ALERT)).toBeInTheDocument();
      expect(queryForm()).toBeInTheDocument();
      expect(
        screen.queryByText(`sign-in for ${SIGN_UP_TEST_EMAIL}`),
      ).not.toBeInTheDocument();
    },
  );

  it("KAN-27: AC-KAN-27-05 does not return to the used sign-up form with the back button", async () => {
    renderSignUpPage();
    await fillAndSubmitSignUp();
    await screen.findByText(`sign-in for ${SIGN_UP_TEST_EMAIL}`);

    await userEvent.click(
      screen.getByRole(ARIA_ROLE.BUTTON, { name: BACK_ACTION }),
    );

    expect(
      screen.getByText(`sign-in for ${SIGN_UP_TEST_EMAIL}`),
    ).toBeInTheDocument();
    expect(queryForm()).not.toBeInTheDocument();
    expect(countCompleteSignUpCalls()).toBe(1);
  });
  it.each([
    ["subscriber", SUBSCRIBER_SESSION, ROUTE_PATH.BUSINESS.ROOT],
    ["super admin", SUPER_ADMIN_SESSION, ROUTE_PATH.ADMIN.ROOT],
  ])(
    "KAN-27: AC-KAN-27-04 sends a signed-in %s to their portal without showing the form",
    async (_roleName, session, portalPath) => {
      renderSignUpPage(SIGN_UP_PATH, session);

      expect(
        await screen.findByText(`portal ${portalPath}`),
      ).toBeInTheDocument();
      expect(queryForm()).not.toBeInTheDocument();
      expect(callFunction).not.toHaveBeenCalledWith(
        "validateSignUpLink",
        expect.anything(),
      );
    },
  );

  it("KAN-27: AC-KAN-27-04 sends a signed-in customer to the landing home without showing the form", async () => {
    renderSignUpPage(SIGN_UP_PATH, CUSTOMER_SESSION);

    expect(
      await screen.findByRole(ARIA_ROLE.HEADING, {
        name: testI18n.t("landing:placeholder.title"),
      }),
    ).toBeInTheDocument();
    expect(queryForm()).not.toBeInTheDocument();
    expect(callFunction).not.toHaveBeenCalledWith(
      "validateSignUpLink",
      expect.anything(),
    );
  });
});
