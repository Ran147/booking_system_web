import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/test-utils/testI18n";

export interface BookingCheckoutPageObject {
  readonly acknowledgePolicy: () => Promise<void>;
  readonly clickChooseAnotherTime: () => Promise<void>;
  readonly clickConfirm: () => Promise<void>;
  readonly findConfirmButton: () => Promise<HTMLElement>;
  readonly findSummary: () => Promise<HTMLElement>;
}

export const createBookingCheckoutPage = (): BookingCheckoutPageObject => {
  const user = userEvent.setup();

  const findConfirmButton = (): Promise<HTMLElement> =>
    screen.findByRole("button", {
      name: testI18n.t("customer:bookingCheckout.confirm.action"),
    });

  return {
    acknowledgePolicy: async (): Promise<void> => {
      await user.click(
        await screen.findByRole("checkbox", {
          name: testI18n.t("customer:bookingCheckout.policies.acknowledge"),
        }),
      );
    },
    clickChooseAnotherTime: async (): Promise<void> => {
      await user.click(
        await screen.findByRole("button", {
          name: testI18n.t(
            "customer:bookingCheckout.confirm.chooseAnotherTime",
          ),
        }),
      );
    },
    clickConfirm: async (): Promise<void> => {
      await user.click(await findConfirmButton());
    },
    findConfirmButton,
    findSummary: (): Promise<HTMLElement> =>
      screen.findByRole("region", {
        name: testI18n.t("customer:bookingCheckout.summary.label"),
      }),
  };
};
