import { screen, waitFor } from "@testing-library/react";
import { ARIA_ROLE, ROUTE_PATH } from "@/constants";
import { renderRoutesWithProviders } from "@/test-utils/renderRoutesWithProviders";
import { SIGNED_OUT_SESSION } from "@/test-utils/sessionFixtures";
import { testI18n } from "@/test-utils/testI18n";
import { authRoutes } from "../auth.routes";
import { SIGN_OUT_REASON } from "../constants/IdleSession.constants";

// The sign-in route is lazy; its first load in a run can exceed 1 s.
const LAZY_PAGE_TIMEOUT_MS = 4_000;

const findSignInTitle = (): Promise<HTMLElement> =>
  screen.findByRole(
    ARIA_ROLE.HEADING,
    { level: 1, name: testI18n.t("auth.signIn.title") },
    { timeout: LAZY_PAGE_TIMEOUT_MS },
  );

describe("sign-in after an inactivity sign-out", () => {
  it("AC-KAN-38-03: shows that the session was closed by inactivity", async () => {
    renderRoutesWithProviders(authRoutes, {
      initialPath: ROUTE_PATH.AUTH.SIGN_IN,
      initialState: { reason: SIGN_OUT_REASON.IDLE },
      session: SIGNED_OUT_SESSION,
    });
    await findSignInTitle();

    expect(screen.getByRole(ARIA_ROLE.ALERT)).toHaveTextContent(
      testI18n.t("auth.idle.signedOut"),
    );
  });

  it("keeps the #hash of the address when the notice is cleared", async () => {
    const { router } = renderRoutesWithProviders(authRoutes, {
      initialPath: `${ROUTE_PATH.AUTH.SIGN_IN}#section`,
      initialState: { reason: SIGN_OUT_REASON.IDLE },
      session: SIGNED_OUT_SESSION,
    });
    await findSignInTitle();

    await waitFor(() => {
      expect(router.state.location.state).toBeNull();
    });
    expect(router.state.location.hash).toBe("#section");
  });

  it("shows nothing when the user arrives at sign-in on their own", async () => {
    renderRoutesWithProviders(authRoutes, {
      initialPath: ROUTE_PATH.AUTH.SIGN_IN,
      session: SIGNED_OUT_SESSION,
    });
    await findSignInTitle();

    expect(screen.queryByRole(ARIA_ROLE.ALERT)).toBeNull();
  });
});
