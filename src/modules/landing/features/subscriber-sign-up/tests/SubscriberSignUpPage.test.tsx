import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { useLocation, type RouteObject } from "react-router";
import { landingRoutes } from "@/modules/landing/landing.routes";
import { ARIA_ROLE, ROUTE_PATH } from "@/shared/constants";
import { callFunction } from "@/shared/lib/firebase";
import {
  SIGNED_OUT_SESSION,
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
import type { SignUpCompletedLocationState } from "../models/SignUpCompletedLocationState.interface";

vi.mock("@/services/firebase/callFunction", () => ({ callFunction: vi.fn() }));

const STRONG_PASSWORD = "Reserva!2026";
const SIGN_UP_PATH = `${ROUTE_PATH.LANDING.SIGN_UP}?token=${SIGN_UP_TEST_TOKEN}`;

// Stand-in for the sign-in page: shows the email the sign-up sent (KAN-27).
const SignInStub = (): ReactElement => {
  const location = useLocation();
  const { signUpEmail } = location.state as SignUpCompletedLocationState;
  return <p>{`sign-in for ${signUpEmail}`}</p>;
};

const testRoutes: RouteObject[] = [
  ...landingRoutes,
  { element: <SignInStub />, path: ROUTE_PATH.AUTH.SIGN_IN },
];

const renderSignUpPage = (initialPath: string = SIGN_UP_PATH): void => {
  renderRoutesWithProviders(testRoutes, {
    initialPath,
    session: SIGNED_OUT_SESSION,
  });
};

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
    await screen.findByText("Básico");
    const signUpPage = createSubscriberSignUpFormPage();

    await signUpPage.typeInto("firstName", "Ana");
    await signUpPage.typeInto("lastName", "Pérez");
    await signUpPage.typeInto("password", STRONG_PASSWORD);
    await signUpPage.typeInto("passwordConfirmation", STRONG_PASSWORD);
    await signUpPage.typeInto("businessName", "Barbería Centro");
    await signUpPage.clickSubmit();

    await waitFor(() => {
      expect(
        screen.getByText(`sign-in for ${SIGN_UP_TEST_EMAIL}`),
      ).toBeInTheDocument();
    });
  });
});
