import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils/testI18n";
import { TERMS_CONSTANTS } from "../constants/Terms.constants";

const CLAUSE_HEADING_LEVEL = 3;

export interface TermsPageObject {
  clickBackToHomeButton: () => Promise<void>;
  getAllClauseHeadings: () => HTMLElement[];
  getBackToHomeButton: () => HTMLElement;
  getContainer: () => HTMLElement;
  getLastUpdated: () => HTMLElement;
  getMainHeading: () => HTMLElement;
}

export const createTermsPageObject = (): TermsPageObject => {
  const user = userEvent.setup();

  const getContainer = (): HTMLElement => {
    const container = document.getElementById(TERMS_CONSTANTS.CONTAINER_ID);
    if (!container) {
      throw new Error(`Container #${TERMS_CONSTANTS.CONTAINER_ID} not found`);
    }
    return container;
  };

  const getMainHeading = (): HTMLElement =>
    screen.getByRole("heading", {
      level: 1,
      name: testI18n.t("landing:terms.title"),
    });

  const getLastUpdated = (): HTMLElement =>
    screen.getByText(testI18n.t("landing:terms.lastUpdated"));

  const getBackToHomeButton = (): HTMLElement =>
    screen.getByRole("button", {
      name: testI18n.t("landing:terms.backToHome"),
    });

  const getAllClauseHeadings = (): HTMLElement[] =>
    screen.getAllByRole("heading", { level: CLAUSE_HEADING_LEVEL });

  const clickBackToHomeButton = async (): Promise<void> => {
    await user.click(getBackToHomeButton());
  };

  return {
    clickBackToHomeButton,
    getAllClauseHeadings,
    getBackToHomeButton,
    getContainer,
    getLastUpdated,
    getMainHeading,
  };
};
