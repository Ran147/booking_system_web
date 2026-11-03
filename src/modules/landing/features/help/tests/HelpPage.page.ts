import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Nullable } from "@/shared/types";
import { testI18n } from "@/test-utils/testI18n";

export interface HelpPageObject {
  clickContactButton: () => Promise<void>;
  clickFaqButton: () => Promise<void>;
  clickSupportTicketsButton: () => Promise<void>;
  getContactButton: () => HTMLButtonElement;
  getDescription: () => HTMLElement;
  getFaqButton: () => HTMLButtonElement;
  getMainHeading: () => HTMLHeadingElement;
  getPublicSupportCard: () => HTMLElement;
  getSubscriberSupportCard: () => HTMLElement;
  getSupportTicketsButton: () => HTMLButtonElement;
  getTopicCardByTitle: (title: string) => HTMLElement;
  querySubscriberSupportCard: () => Nullable<HTMLElement>;
}

export const createHelpPageObject = (): HelpPageObject => {
  const user = userEvent.setup({ delay: null });

  const getMainHeading = (): HTMLHeadingElement =>
    screen.getByRole("heading", {
      level: 1,
      name: testI18n.t("landing:help.page.title"),
    }) as HTMLHeadingElement;

  const getDescription = (): HTMLElement =>
    screen.getByText(testI18n.t("landing:help.page.description"));

  const getTopicCardByTitle = (title: string): HTMLElement =>
    screen.getByRole("heading", { level: 3, name: title });

  const querySubscriberSupportCard = (): Nullable<HTMLElement> =>
    screen.queryByTestId("subscriber-support-card");

  const getSubscriberSupportCard = (): HTMLElement =>
    screen.getByTestId("subscriber-support-card");

  const getPublicSupportCard = (): HTMLElement =>
    screen.getByTestId("public-support-card");

  const getContactButton = (): HTMLButtonElement =>
    screen.getByRole("button", {
      name: testI18n.t("landing:help.publicSupport.action"),
    }) as HTMLButtonElement;

  const getFaqButton = (): HTMLButtonElement =>
    screen.getByRole("button", {
      name: testI18n.t("landing:help.page.faqAction"),
    }) as HTMLButtonElement;

  const getSupportTicketsButton = (): HTMLButtonElement =>
    screen.getByRole("button", {
      name: testI18n.t("landing:help.subscriberSupport.action"),
    }) as HTMLButtonElement;

  const clickContactButton = async (): Promise<void> => {
    await user.click(getContactButton());
  };

  const clickFaqButton = async (): Promise<void> => {
    await user.click(getFaqButton());
  };

  const clickSupportTicketsButton = async (): Promise<void> => {
    await user.click(getSupportTicketsButton());
  };

  return {
    clickContactButton,
    clickFaqButton,
    clickSupportTicketsButton,
    getContactButton,
    getDescription,
    getFaqButton,
    getMainHeading,
    getPublicSupportCard,
    getSubscriberSupportCard,
    getSupportTicketsButton,
    getTopicCardByTitle,
    querySubscriberSupportCard,
  };
};
