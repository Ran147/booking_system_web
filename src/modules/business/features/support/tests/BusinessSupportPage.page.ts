import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/constants";
import { testI18n } from "@/test-utils";

export interface BusinessSupportPageObject {
  readonly clickCloseDrawerButton: () => Promise<void>;
  readonly clickCloseModalButton: () => Promise<void>;
  readonly clickCreateFirstTicketButton: () => Promise<void>;
  readonly clickNewTicketButton: () => Promise<void>;
  readonly clickSubmitTicketButton: () => Promise<void>;
  readonly clickTicketRow: (subject: string) => Promise<void>;
  readonly fillTicketForm: (subject: string, message: string) => Promise<void>;
  readonly getDetailDrawerHeading: (subject: string) => HTMLElement;
  readonly getDetailDrawerMessages: (message: string) => HTMLElement[];
  readonly getEmptyStateHeading: () => HTMLElement;
  readonly getPageHeading: () => HTMLElement;
  readonly getPendingSubmitTicketButton: () => HTMLElement;
  readonly getReplyElement: (replyBody: string) => HTMLElement;
  readonly getSubmitTicketButton: () => HTMLElement;
  readonly getTicketRow: (subject: string) => HTMLElement;
  readonly getTicketStatusBadge: (
    subject: string,
    statusLabel: string,
  ) => HTMLElement;
}

export const createBusinessSupportPage = (): BusinessSupportPageObject => {
  const user = userEvent.setup();

  const getPageHeading = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.HEADING, {
      level: 1,
      name: testI18n.t("business:support.list.pageTitle"),
    });

  const getEmptyStateHeading = (): HTMLElement =>
    screen.getByText(testI18n.t("business:support.list.emptyTitle"));

  const clickNewTicketButton = async (): Promise<void> => {
    const button = screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("business:support.actions.newTicket"),
    });
    await user.click(button);
  };

  const clickCreateFirstTicketButton = async (): Promise<void> => {
    const button = screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("business:support.list.emptyAction"),
    });
    await user.click(button);
  };

  const fillTicketForm = async (
    subject: string,
    message: string,
  ): Promise<void> => {
    const subjectInput = screen.getByLabelText(
      new RegExp(`^${testI18n.t("business:support.create.subjectLabel")}\\*?$`),
    );
    const messageInput = screen.getByLabelText(
      new RegExp(`^${testI18n.t("business:support.create.messageLabel")}\\*?$`),
    );

    await user.clear(subjectInput);
    if (subject.length > 0) {
      await user.type(subjectInput, subject);
    }

    await user.clear(messageInput);
    if (message.length > 0) {
      await user.type(messageInput, message);
    }
  };

  const getPendingSubmitTicketButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("business:support.actions.creating"),
    });

  const getSubmitTicketButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("business:support.actions.create"),
    });

  const clickSubmitTicketButton = async (): Promise<void> => {
    const submitButton = getSubmitTicketButton();
    await user.click(submitButton);
  };

  const clickCloseModalButton = async (): Promise<void> => {
    const cancelButton = screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("business:support.actions.cancel"),
    });
    await user.click(cancelButton);
  };

  const getTicketRow = (subject: string): HTMLElement => {
    const subjectCell = screen.getByText(subject);
    const row = subjectCell.closest("tr");
    if (!row) {
      throw new Error(`Row for ticket "${subject}" not found`);
    }
    return row;
  };

  const getTicketStatusBadge = (
    subject: string,
    statusLabel: string,
  ): HTMLElement => {
    const row = getTicketRow(subject);
    return within(row).getByText(statusLabel);
  };

  const clickTicketRow = async (subject: string): Promise<void> => {
    const row = getTicketRow(subject);
    await user.click(row);
  };

  const getDetailDrawerHeading = (subject: string): HTMLElement =>
    screen.getByRole(ARIA_ROLE.HEADING, {
      level: 3,
      name: subject,
    });

  const getDetailDrawerMessages = (message: string): HTMLElement[] =>
    screen.getAllByText(message);

  const getReplyElement = (replyBody: string): HTMLElement =>
    screen.getByText(replyBody);

  const clickCloseDrawerButton = async (): Promise<void> => {
    const closeButtons = screen.getAllByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("business:support.actions.close"),
    });
    const targetButton = closeButtons[0];
    if (targetButton) {
      await user.click(targetButton);
    }
  };

  return {
    clickCloseDrawerButton,
    clickCloseModalButton,
    clickCreateFirstTicketButton,
    clickNewTicketButton,
    clickSubmitTicketButton,
    clickTicketRow,
    fillTicketForm,
    getDetailDrawerHeading,
    getDetailDrawerMessages,
    getEmptyStateHeading,
    getPageHeading,
    getPendingSubmitTicketButton,
    getReplyElement,
    getSubmitTicketButton,
    getTicketRow,
    getTicketStatusBadge,
  };
};
