import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/constants";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/types";

export interface BookingDetailDrawerPageObject {
  readonly clickCancelAction: () => Promise<void>;
  readonly clickCompleteAction: () => Promise<void>;
  readonly clickConfirmAction: () => Promise<void>;
  readonly clickNoShowAction: () => Promise<void>;
  readonly clickRescheduleAction: () => Promise<void>;
  readonly getHeading: (title: string) => HTMLElement;
  readonly queryCancelAction: () => Nullable<HTMLElement>;
  readonly queryCompleteAction: () => Nullable<HTMLElement>;
  readonly queryConfirmAction: () => Nullable<HTMLElement>;
  readonly queryNoShowAction: () => Nullable<HTMLElement>;
  readonly queryRescheduleAction: () => Nullable<HTMLElement>;
}

export const createBookingDetailDrawerPage =
  (): BookingDetailDrawerPageObject => {
    const user = userEvent.setup();

    const queryConfirmAction = (): Nullable<HTMLElement> =>
      screen.queryByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("business:schedule.bookings.confirmAction"),
      });

    const queryCompleteAction = (): Nullable<HTMLElement> =>
      screen.queryByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("business:schedule.bookings.completeAction"),
      });

    const queryNoShowAction = (): Nullable<HTMLElement> =>
      screen.queryByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("business:schedule.bookings.noShowAction"),
      });

    const queryRescheduleAction = (): Nullable<HTMLElement> =>
      screen.queryByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("business:schedule.bookings.rescheduleAction"),
      });

    const queryCancelAction = (): Nullable<HTMLElement> =>
      screen.queryByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("business:schedule.bookings.cancelAction"),
      });

    const getHeading = (title: string): HTMLElement =>
      screen.getByRole("heading", { name: title });

    const clickConfirmAction = async (): Promise<void> => {
      await user.click(
        screen.getByRole(ARIA_ROLE.BUTTON, {
          name: testI18n.t("business:schedule.bookings.confirmAction"),
        }),
      );
    };

    const clickCompleteAction = async (): Promise<void> => {
      await user.click(
        screen.getByRole(ARIA_ROLE.BUTTON, {
          name: testI18n.t("business:schedule.bookings.completeAction"),
        }),
      );
    };

    const clickNoShowAction = async (): Promise<void> => {
      await user.click(
        screen.getByRole(ARIA_ROLE.BUTTON, {
          name: testI18n.t("business:schedule.bookings.noShowAction"),
        }),
      );
    };

    const clickRescheduleAction = async (): Promise<void> => {
      await user.click(
        screen.getByRole(ARIA_ROLE.BUTTON, {
          name: testI18n.t("business:schedule.bookings.rescheduleAction"),
        }),
      );
    };

    const clickCancelAction = async (): Promise<void> => {
      await user.click(
        screen.getByRole(ARIA_ROLE.BUTTON, {
          name: testI18n.t("business:schedule.bookings.cancelAction"),
        }),
      );
    };

    return {
      clickCancelAction,
      clickCompleteAction,
      clickConfirmAction,
      clickNoShowAction,
      clickRescheduleAction,
      getHeading,
      queryCancelAction,
      queryCompleteAction,
      queryConfirmAction,
      queryNoShowAction,
      queryRescheduleAction,
    };
  };

