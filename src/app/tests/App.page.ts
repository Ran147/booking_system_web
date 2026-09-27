import { screen } from "@testing-library/react";
import { ARIA_ROLE } from "@/shared/constants";

export interface AppPageObject {
  findPageHeading: (headingText: string) => Promise<HTMLElement>;
}

export const createAppPage = (): AppPageObject => ({
  findPageHeading: (headingText: string): Promise<HTMLElement> =>
    screen.findByRole(ARIA_ROLE.HEADING, { level: 1, name: headingText }),
});
