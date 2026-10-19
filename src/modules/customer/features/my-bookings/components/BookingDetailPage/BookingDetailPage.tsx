import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useBookingDetailViewModel } from "@/modules/customer/features/my-bookings";
import {
  AppLink,
  Button,
  ErrorState,
  PageTemplate,
  Spinner,
} from "@/shared/components";
import { I18N_NAMESPACE, VIEW_STATE } from "@/shared/constants";
import { BookingDetailSummary } from "../BookingDetailSummary";

export const BookingDetailPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useBookingDetailViewModel();

  return (
    <PageTemplate
      actions={
        <AppLink to={viewModel.listPath}>{t("myBookings.detail.back")}</AppLink>
      }
      title={t("myBookings.detail.title")}
    >
      {viewModel.viewState === VIEW_STATE.LOADING && <Spinner />}
      {viewModel.viewState === VIEW_STATE.ERROR && (
        <div className="flex flex-col items-center gap-3">
          <ErrorState messageKey={viewModel.errorMessageKey} />
          {viewModel.isRetryable && (
            <Button onClick={viewModel.handleRetry} variant="outline">
              {t("myBookings.retryAction")}
            </Button>
          )}
        </div>
      )}
      {viewModel.detail && <BookingDetailSummary detail={viewModel.detail} />}
    </PageTemplate>
  );
};
