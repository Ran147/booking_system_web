import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";
import {
  AppLink,
  Button,
  Card,
  CardContent,
  ErrorState,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE, VIEW_STATE } from "@/constants";
import { useBookingConfirmationViewModel } from "@/modules/customer/features/booking-checkout";

/** The booking was registered: confirmed or waiting for the business (KAN-149). */
export const BookingConfirmationPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useBookingConfirmationViewModel();
  const { detail, headingReference } = viewModel;

  if (viewModel.viewState === VIEW_STATE.LOADING) return <Spinner />;
  if (!detail) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3">
        <ErrorState messageKey={viewModel.errorMessageKey} />
        {viewModel.isRetryable ? (
          <Button onClick={viewModel.handleRetry} variant="outline">
            {t("bookingCheckout.retryAction")}
          </Button>
        ) : null}
      </div>
    );
  }
  if (viewModel.closedBookingPath) {
    return <Navigate replace to={viewModel.closedBookingPath} />;
  }

  const rows = [
    {
      label: t("bookingCheckout.summary.business"),
      value: detail.businessName,
    },
    { label: t("bookingCheckout.summary.service"), value: detail.serviceName },
    ...(detail.collaboratorName
      ? [
          {
            label: t("bookingCheckout.summary.collaborator"),
            value: detail.collaboratorName,
          },
        ]
      : []),
    {
      label: t("bookingCheckout.summary.time"),
      value: `${detail.startsAtLabel} – ${detail.endsAtLabel}`,
    },
    { label: t("bookingCheckout.summary.price"), value: detail.priceLabel },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1
        className="text-2xl font-semibold text-foreground outline-none"
        ref={headingReference}
        tabIndex={-1}
      >
        {viewModel.isPending
          ? t("bookingCheckout.success.pendingTitle")
          : t("bookingCheckout.success.confirmedTitle")}
      </h1>
      {viewModel.isPending ? (
        <p className="text-muted-foreground">
          {t("bookingCheckout.success.pendingDescription")}
        </p>
      ) : null}
      <Card>
        <CardContent className="pt-6">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className="text-sm text-muted-foreground">{row.label}</dt>
                <dd className="font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-4">
        <AppLink to={viewModel.myBookingsPath}>
          {t("bookingCheckout.success.myBookingsAction")}
        </AppLink>
        <AppLink to={viewModel.businessHomePath}>
          {t("bookingCheckout.success.backToBusinessAction")}
        </AppLink>
      </div>
    </div>
  );
};
