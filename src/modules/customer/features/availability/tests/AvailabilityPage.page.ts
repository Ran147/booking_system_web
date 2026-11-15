import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/test-utils/testI18n";

export interface AvailabilityPageObject {
  readonly clickBackToServices: () => Promise<void>;
  readonly clickContinue: () => Promise<void>;
  readonly clickDay: (label: RegExp) => Promise<void>;
  readonly clickRetry: () => Promise<void>;
  readonly chooseSlot: (timeLabel: string) => Promise<void>;
  readonly findSlotLabels: () => Promise<string[]>;
  readonly getContinueButton: () => HTMLElement;
  readonly getDayButtons: () => HTMLElement[];
  readonly getPreviousWeekButton: () => HTMLElement;
}

export const createAvailabilityPage = (): AvailabilityPageObject => {
  const user = userEvent.setup();

  const clickButton = async (name: string | RegExp): Promise<void> => {
    await user.click(await screen.findByRole("button", { name }));
  };

  return {
    chooseSlot: async (timeLabel: string): Promise<void> => {
      await user.click(await screen.findByRole("radio", { name: timeLabel }));
    },
    clickBackToServices: () =>
      clickButton(testI18n.t("customer:availability.backToServices")),
    clickContinue: () =>
      clickButton(testI18n.t("customer:availability.continueAction")),
    clickDay: (label: RegExp) => clickButton(label),
    clickRetry: () =>
      clickButton(testI18n.t("customer:availability.retryAction")),
    findSlotLabels: async (): Promise<string[]> => {
      const group = await screen.findByRole("radiogroup");
      return within(group)
        .getAllByRole("radio")
        .map((radio) => radio.closest("label")?.textContent?.trim() ?? "");
    },
    getContinueButton: (): HTMLElement =>
      screen.getByRole("button", {
        name: testI18n.t("customer:availability.continueAction"),
      }),
    getDayButtons: (): HTMLElement[] =>
      within(
        screen.getByRole("list", {
          name: testI18n.t("customer:availability.dateGroupLabel"),
        }),
      ).getAllByRole("button"),
    getPreviousWeekButton: (): HTMLElement =>
      screen.getByRole("button", {
        name: testI18n.t("customer:availability.previousWeek"),
      }),
  };
};
