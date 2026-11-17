import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { BookingSummaryCardProps } from "@/modules/customer/features/booking-checkout";
import type { Nullable } from "@/types";

/** The booking before confirming (AC-KAN-146-01, 05 to 07). */
export const BookingSummaryCard = ({
  viewModel,
}: BookingSummaryCardProps): Nullable<ReactElement> => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const { summary } = viewModel;
  if (!summary) return null;

  const rows = [
    {
      label: t("bookingCheckout.summary.business"),
      value: summary.businessName,
    },
    { label: t("bookingCheckout.summary.service"), value: summary.serviceName },
    ...(summary.hasCollaborators
      ? [
          {
            label: t("bookingCheckout.summary.collaborator"),
            value: t("bookingCheckout.summary.anyCollaborator"),
          },
        ]
      : []),
    { label: t("bookingCheckout.summary.date"), value: viewModel.dateLabel },
    { label: t("bookingCheckout.summary.time"), value: viewModel.timeLabel },
    {
      label: t("bookingCheckout.summary.duration"),
      value: t("bookingCheckout.summary.durationValue", {
        minutes: viewModel.durationMinutes,
      }),
    },
  ];

  return (
    <Card aria-label={t("bookingCheckout.summary.label")} role="region">
      <CardHeader>
        <CardTitle>{t("bookingCheckout.summary.label")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <dd className="font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
          <div>
            <dt className="text-sm text-muted-foreground">
              {t("bookingCheckout.summary.price")}
            </dt>
            <dd className="flex items-baseline gap-2 font-medium text-foreground">
              {viewModel.originalPriceLabel ? (
                <s
                  aria-label={t("bookingCheckout.summary.originalPrice", {
                    price: viewModel.originalPriceLabel,
                  })}
                  className="text-sm text-muted-foreground"
                >
                  {viewModel.originalPriceLabel}
                </s>
              ) : null}
              <span>{viewModel.priceLabel}</span>
            </dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">
          {t("bookingCheckout.summary.timeZoneNote", {
            timeZone: summary.timeZone,
          })}
        </p>
      </CardContent>
    </Card>
  );
};
