import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/test-utils";
import type { NullableRef } from "@/types";

interface CustomerProfilePageObject {
  clickOpen: () => Promise<void>;
  clickReturn: () => Promise<void>;
  clickRetry: () => Promise<void>;
  findAlert: () => Promise<HTMLElement>;
  findHeading: () => Promise<HTMLElement>;
  findValue: (value: string) => Promise<HTMLElement>;
  getDefinitions: () => HTMLElement[];
  getLoading: () => HTMLElement;
  getMissing: () => HTMLElement;
  getReturn: () => HTMLElement;
  queryValue: (value: string) => NullableRef<HTMLElement>;
  tab: () => Promise<void>;
}

export const createCustomerProfilePage = (): CustomerProfilePageObject => {
  const user = userEvent.setup();
  return {
    clickOpen: async (): Promise<void> => {
      await user.click(
        screen.getByRole("link", {
          name: testI18n.t("customer:profile.navigation.open"),
        }),
      );
    },
    clickReturn: async (): Promise<void> => {
      await user.click(
        screen.getByRole("link", {
          name: testI18n.t("customer:profile.navigation.back"),
        }),
      );
    },
    clickRetry: async (): Promise<void> => {
      await user.click(
        screen.getByRole("button", {
          name: testI18n.t("customer:profile.actions.retry"),
        }),
      );
    },
    findAlert: (): Promise<HTMLElement> => screen.findByRole("alert"),
    findHeading: (): Promise<HTMLElement> =>
      screen.findByRole("heading", {
        name: testI18n.t("customer:profile.title"),
        level: 1,
      }),
    findValue: (value: string): Promise<HTMLElement> =>
      screen.findByText(value),
    getDefinitions: (): HTMLElement[] => screen.getAllByRole("definition"),
    getLoading: (): HTMLElement =>
      screen.getByRole("status", { name: testI18n.t("common:status.loading") }),
    getMissing: (): HTMLElement =>
      screen.getByRole("status", {
        name: testI18n.t("customer:profile.states.notFound"),
      }),
    getReturn: (): HTMLElement =>
      screen.getByRole("link", {
        name: testI18n.t("customer:profile.navigation.back"),
      }),
    queryValue: (value: string): NullableRef<HTMLElement> =>
      screen.queryByText(value),
    tab: (): Promise<void> => user.tab(),
  };
};
