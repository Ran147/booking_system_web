import { screen } from "@testing-library/react";
import type { RouteObject } from "react-router";
import { ROUTE_PATH, SEARCH_PARAM } from "@/constants";
import { USER_ROLE } from "@/domain";
import { renderRoutesWithProviders } from "@/test-utils/renderRoutesWithProviders";
import {
  COLLABORATOR_SESSION,
  CUSTOMER_SESSION,
  SIGNED_OUT_SESSION,
} from "@/test-utils/sessionFixtures";
import { CURRENT_PATH_TEST_ID, CurrentPathProbe } from "./CurrentPathProbe";
import { RequireRole } from "../components/RequireRole";

// Two guarded portals whose pages show the path; anything else too.
const testRoutes: RouteObject[] = [
  {
    children: [{ element: <CurrentPathProbe />, index: true }],
    element: (
      <RequireRole
        allowedRoles={[USER_ROLE.SUBSCRIBER, USER_ROLE.COLLABORATOR]}
      />
    ),
    path: ROUTE_PATH.BUSINESS.ROOT,
  },
  {
    children: [{ element: <CurrentPathProbe />, index: true }],
    element: <RequireRole allowedRoles={[USER_ROLE.SUPER_ADMIN]} />,
    path: ROUTE_PATH.ADMIN.ROOT,
  },
  { element: <CurrentPathProbe />, path: ROUTE_PATH.NOT_FOUND },
];

const findCurrentPath = async (): Promise<string> =>
  (await screen.findByTestId(CURRENT_PATH_TEST_ID)).textContent ?? "";

describe("RequireRole", () => {
  it("AC-KAN-33-03: sends a visitor to sign-in with the page as redirectTo", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.BUSINESS.ROOT,
      session: SIGNED_OUT_SESSION,
    });

    expect(await findCurrentPath()).toBe(
      `${ROUTE_PATH.AUTH.SIGN_IN}?${SEARCH_PARAM.REDIRECT_TO}=${encodeURIComponent(ROUTE_PATH.BUSINESS.ROOT)}`,
    );
  });

  it.each([ROUTE_PATH.BUSINESS.ROOT, ROUTE_PATH.ADMIN.ROOT])(
    "AC-KAN-129-06: sends a customer from %s to their portal home",
    async (initialPath) => {
      renderRoutesWithProviders(testRoutes, {
        initialPath,
        session: CUSTOMER_SESSION,
      });

      expect(await findCurrentPath()).toBe(ROUTE_PATH.LANDING.HOME);
    },
  );

  it("AC-KAN-33-03: sends a role that cannot see the page to its own portal", async () => {
    renderRoutesWithProviders(testRoutes, {
      initialPath: ROUTE_PATH.ADMIN.ROOT,
      session: COLLABORATOR_SESSION,
    });

    expect(await findCurrentPath()).toBe(ROUTE_PATH.BUSINESS.ROOT);
  });
});
