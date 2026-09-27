import { screen } from "@testing-library/react";
import { ARIA_ROLE } from "@/shared/constants";

export interface AppRoutesPageObject {
  findPageHeading: (headingText: string) => Promise<HTMLElement>;
}

export const createAppRoutesPage = (): AppRoutesPageObject => ({
  findPageHeading: (headingText: string): Promise<HTMLElement> =>
    screen.findByRole(ARIA_ROLE.HEADING, { level: 1, name: headingText }),
});
