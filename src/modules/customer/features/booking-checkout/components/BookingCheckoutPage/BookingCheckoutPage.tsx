import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  ErrorState,
  PageTemplate,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import {
  CHECKOUT_ERROR_ACTION,
  useBookingCheckoutViewModel,
} from "@/modules/customer/features/booking-checkout";
import { BookingPolicyNotice } from "../BookingPolicyNotice/BookingPolicyNotice";
import { BookingSummaryCard } from "../BookingSummaryCard/BookingSummaryCard";

/** Review the booking and its policies, then confirm (KAN-146 to KAN-148). */
export const BookingCheckoutPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useBookingCheckoutViewModel();
  const { confirmError } = viewModel;

  return (
    <PageTemplate
      description={t("bookingCheckout.subtitle")}
      title={t("bookingCheckout.title")}
    >
      {viewModel.isLoading ? <Spinner /> : null}
      {viewModel.loadErrorKey ? (
        <div className="flex flex-col items-start gap-3">
          <ErrorState messageKey={viewModel.loadErrorKey} />
          <Button onClick={viewModel.handleRetryLoad} variant="outline">
            {t("bookingCheckout.retryAction")}
          </Button>
        </div>
      ) : null}
      {viewModel.summary ? (
        <div className="flex flex-col gap-6">
          <BookingSummaryCard viewModel={viewModel} />
          <BookingPolicyNotice viewModel={viewModel} />
          {confirmError?.messageKey ? (
            <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>
              {t(confirmError.messageKey)}
            </Alert>
          ) : null}
          {confirmError?.commonMessageKey ? (
            <ErrorState messageKey={confirmError.commonMessageKey} />
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
            <Button onClick={viewModel.handleChangeService} variant="ghost">
              {t("bookingCheckout.changeServiceAction")}
            </Button>
            <Button onClick={viewModel.handleChangeTime} variant="outline">
              {confirmError?.action ===
              CHECKOUT_ERROR_ACTION.CHOOSE_ANOTHER_TIME
                ? t("bookingCheckout.confirm.chooseAnotherTime")
                : t("bookingCheckout.changeTimeAction")}
            </Button>
            <Button
              aria-busy={viewModel.isConfirming}
              disabled={!viewModel.canConfirm}
              isLoading={viewModel.isConfirming}
              onClick={viewModel.handleConfirm}
            >
              {viewModel.isConfirming
                ? t("bookingCheckout.confirm.submitting")
                : t("bookingCheckout.confirm.action")}
            </Button>
          </div>
        </div>
      ) : null}
    </PageTemplate>
  );
};
