import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/test-utils/testI18n";

export interface BookingRemindersPageObject {
  clickToggle: () => Promise<void>;
  findStatus: (isEnabled: boolean) => Promise<HTMLElement>;
  getToggle: () => HTMLElement;
}

export const createBookingRemindersPage = (): BookingRemindersPageObject => {
  const user = userEvent.setup();
  const getToggle = (): HTMLElement => screen.getByRole("switch");

  return {
    clickToggle: async () => user.click(getToggle()),
    findStatus: async (isEnabled) =>
      screen.findByText(
        testI18n.t(
          `customer:profile.reminders.${isEnabled ? "enabled" : "disabled"}`,
        ),
      ),
    getToggle,
  };
};
