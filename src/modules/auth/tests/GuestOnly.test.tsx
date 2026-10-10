import { screen } from "@testing-library/react";
import type { RouteObject } from "react-router";
import { ROUTE_PATH, SEARCH_PARAM } from "@/constants";
import { renderRoutesWithProviders } from "@/test-utils/renderRoutesWithProviders";
import {
  CUSTOMER_SESSION,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  SUPER_ADMIN_SESSION,
} from "@/test-utils/sessionFixtures";
import { CURRENT_PATH_TEST_ID, CurrentPathProbe } from "./CurrentPathProbe";
import { GuestOnly } from "../components/GuestOnly";

const BUSINESS_PAGE_PATH = "/barberia-centro";
const SIGN_IN_STAND_IN_TEST_ID = "sign-in-stand-in";

// A stand-in replaces the sign-in page; any other path shows where we landed.
const testRoutes: RouteObject[] = [
  {
    children: [
      {
        element: <p data-testid={SIGN_IN_STAND_IN_TEST_ID} />,
        path: ROUTE_PATH.AUTH.SIGN_IN,
      },
    ],
    element: <GuestOnly />,
  },
  { element: <CurrentPathProbe />, path: ROUTE_PATH.NOT_FOUND },
];

const findCurrentPath = async (): Promise<string> =>
  (await screen.findByTestId(CURRENT_PATH_TEST_ID)).textContent ?? "";

describe("GuestOnly", () => {
  it("shows sign-in to a visitor", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.AUTH.SIGN_IN,
      session: SIGNED_OUT_SESSION,
    });

    expect(
      await screen.findByTestId(SIGN_IN_STAND_IN_TEST_ID),
    ).toBeInTheDocument();
  });

  it.each([
    ["subscriber", SUBSCRIBER_SESSION, ROUTE_PATH.BUSINESS.ROOT],
    ["super admin", SUPER_ADMIN_SESSION, ROUTE_PATH.ADMIN.ROOT],
    ["customer", CUSTOMER_SESSION, ROUTE_PATH.LANDING.HOME],
  ])(
    "AC-KAN-33-07: sends a signed-in %s from sign-in to their portal",
    async (_roleName, session, expectedPath) => {
      renderRoutesWithProviders(testRoutes, {
        initialPath: ROUTE_PATH.AUTH.SIGN_IN,
        session,
      });

      expect(await findCurrentPath()).toBe(expectedPath);
    },
  );

  it("AC-KAN-33-07: honours a safe redirectTo for a signed-in user", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: `${ROUTE_PATH.AUTH.SIGN_IN}?${SEARCH_PARAM.REDIRECT_TO}=${encodeURIComponent(BUSINESS_PAGE_PATH)}`,
      session: CUSTOMER_SESSION,
    });

    expect(await findCurrentPath()).toBe(BUSINESS_PAGE_PATH);
  });
});
