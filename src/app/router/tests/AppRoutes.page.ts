import { screen } from "@testing-library/react";
import { ARIA_ROLE } from "@/shared/constants";

// Lazy routes are transformed on first use; a cold run (the sign-in page
// pulls in the Firebase SDK) can take longer than the default 1 s.
const LAZY_ROUTE_TIMEOUT_MS = 5_000;

export interface AppRoutesPageObject {
  findPageHeading: (headingText: string) => Promise<HTMLElement>;
}

export const createAppRoutesPage = (): AppRoutesPageObject => ({
  findPageHeading: (headingText: string): Promise<HTMLElement> =>
    screen.findByRole(
      ARIA_ROLE.HEADING,
      { level: 1, name: headingText },
      { timeout: LAZY_ROUTE_TIMEOUT_MS },
    ),
});
