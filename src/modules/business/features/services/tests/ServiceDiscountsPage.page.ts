import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/test-utils/testI18n";
import type { Nullable } from "@/types";

export interface ServiceDiscountsPageObject {
  readonly clickAdd: () => Promise<void>;
  readonly clickRemove: (index?: number) => Promise<void>;
  readonly getAddButton: () => HTMLElement;
  readonly getDiscountsTableRows: () => HTMLElement[];
  readonly getEmptyState: () => Nullable<HTMLElement>;
  readonly getEndDateInput: () => HTMLElement;
  readonly getErrorMessage: () => Nullable<HTMLElement>;
  readonly getReadOnlyAlert: () => Nullable<HTMLElement>;
  readonly getStartDateInput: () => HTMLElement;
  readonly getTitle: () => HTMLElement;
  readonly getTypeSelect: () => HTMLElement;
  readonly getValueInput: () => HTMLElement;
  readonly selectType: (typeValue: string) => Promise<void>;
  readonly typeEndDate: (date: string) => Promise<void>;
  readonly typeStartDate: (date: string) => Promise<void>;
  readonly typeValue: (value: number | string) => Promise<void>;
}

export const createServiceDiscountsPage = (
  user = userEvent.setup(),
): ServiceDiscountsPageObject => {
  return {
    clickAdd: async (): Promise<void> => {
      const button = screen.getByRole("button", {
        name: testI18n.t("services.discounts.addDiscountAction", {
          ns: "business",
        }),
      });
      await user.click(button);
    },

    clickRemove: async (index = 0): Promise<void> => {
      const buttons = screen.getAllByRole("button", {
        name: testI18n.t("services.discounts.removeAction", { ns: "business" }),
      });
      const targetButton = buttons[index];
      if (targetButton) {
        await user.click(targetButton);
      }
    },

    getAddButton: (): HTMLElement =>
      screen.getByRole("button", {
        name: testI18n.t("services.discounts.addDiscountAction", {
          ns: "business",
        }),
      }),

    getDiscountsTableRows: (): HTMLElement[] => screen.queryAllByRole("row"),

    getEmptyState: (): Nullable<HTMLElement> =>
      screen.queryByText(
        testI18n.t("services.discounts.emptyTitle", { ns: "business" }),
      ),

    getEndDateInput: (): HTMLElement =>
      screen.getByLabelText(
        testI18n.t("services.discounts.endDateLabel", { ns: "business" }),
      ),

    getErrorMessage: (): Nullable<HTMLElement> => screen.queryByRole("alert"),

    getReadOnlyAlert: (): Nullable<HTMLElement> =>
      screen.queryByText(testI18n.t("errors.readOnly", { ns: "business" })),

    getStartDateInput: (): HTMLElement =>
      screen.getByLabelText(
        testI18n.t("services.discounts.startDateLabel", { ns: "business" }),
      ),

    getTitle: (): HTMLElement =>
      screen.getByRole("heading", {
        name: testI18n.t("services.discounts.title", { ns: "business" }),
      }),

    getTypeSelect: (): HTMLElement =>
      screen.getByLabelText(
        testI18n.t("services.discounts.typeLabel", { ns: "business" }),
      ),

    getValueInput: (): HTMLElement =>
      screen.getByLabelText(
        testI18n.t("services.discounts.valueLabel", { ns: "business" }),
      ),

    selectType: async (typeValue: string): Promise<void> => {
      const select = await screen.findByLabelText(
        testI18n.t("services.discounts.typeLabel", { ns: "business" }),
      );
      await user.selectOptions(select, typeValue);
    },

    typeEndDate: async (date: string): Promise<void> => {
      const input = await screen.findByLabelText(
        testI18n.t("services.discounts.endDateLabel", { ns: "business" }),
      );
      await user.clear(input);
      await user.type(input, date);
    },

    typeStartDate: async (date: string): Promise<void> => {
      const input = await screen.findByLabelText(
        testI18n.t("services.discounts.startDateLabel", { ns: "business" }),
      );
      await user.clear(input);
      await user.type(input, date);
    },

    typeValue: async (value: number | string): Promise<void> => {
      const input = await screen.findByLabelText(
        testI18n.t("services.discounts.valueLabel", { ns: "business" }),
      );
      await user.clear(input);
      await user.type(input, String(value));
    },
  };
};
