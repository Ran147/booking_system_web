import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Nullable } from "@/shared/types";
import { testI18n } from "@/test-utils/testI18n";

export interface FaqPageObject {
  clickContactCtaButton: () => Promise<void>;
  clickEmptyStateCtaButton: () => Promise<void>;
  clickQuestion: (questionText: string) => Promise<void>;
  getAnswer: (answerText: string) => HTMLElement;
  getContactCtaButton: () => HTMLButtonElement;
  getDescription: () => HTMLElement;
  getEmptyStateCtaButton: () => HTMLButtonElement;
  getEmptyStateMessage: () => HTMLElement;
  getGroupHeadings: () => HTMLElement[];
  getMainHeading: () => HTMLHeadingElement;
  getQuestionButton: (questionText: string) => HTMLButtonElement;
  queryAnswer: (answerText: string) => Nullable<HTMLElement>;
}

export const createFaqPageObject = (): FaqPageObject => {
  const user = userEvent.setup({ delay: null });

  const getMainHeading = (): HTMLHeadingElement =>
    screen.getByRole("heading", {
      level: 1,
      name: testI18n.t("landing:faq.page.title"),
    }) as HTMLHeadingElement;

  const getDescription = (): HTMLElement =>
    screen.getByText(testI18n.t("landing:faq.page.description"));

  const getGroupHeadings = (): HTMLElement[] =>
    screen.getAllByRole("heading", { level: 2 });

  const getQuestionButton = (questionText: string): HTMLButtonElement =>
    screen.getByRole("button", {
      name: new RegExp(questionText, "i"),
    }) as HTMLButtonElement;

  const getAnswer = (answerText: string): HTMLElement =>
    screen.getByText(answerText);

  const queryAnswer = (answerText: string): Nullable<HTMLElement> =>
    screen.queryByText(answerText);

  const getContactCtaButton = (): HTMLButtonElement =>
    screen.getByRole("button", {
      name: testI18n.t("landing:faq.cta.action"),
    }) as HTMLButtonElement;

  const getEmptyStateMessage = (): HTMLElement =>
    screen.getByText(testI18n.t("landing:faq.empty.description"));

  const getEmptyStateCtaButton = (): HTMLButtonElement =>
    screen.getByRole("button", {
      name: testI18n.t("landing:faq.empty.action"),
    }) as HTMLButtonElement;

  const clickQuestion = async (questionText: string): Promise<void> => {
    await user.click(getQuestionButton(questionText));
  };

  const clickContactCtaButton = async (): Promise<void> => {
    await user.click(getContactCtaButton());
  };

  const clickEmptyStateCtaButton = async (): Promise<void> => {
    await user.click(getEmptyStateCtaButton());
  };

  return {
    clickContactCtaButton,
    clickEmptyStateCtaButton,
    clickQuestion,
    getAnswer,
    getContactCtaButton,
    getDescription,
    getEmptyStateCtaButton,
    getEmptyStateMessage,
    getGroupHeadings,
    getMainHeading,
    getQuestionButton,
    queryAnswer,
  };
};
