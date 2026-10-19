import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  BookingStatusLabel,
  Card,
  CardContent,
  StatusBadge,
} from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import { BOOKING_STATUS, BOOKING_STATUS_TONE } from "@/shared/domain";
import type { BookingDetailSummaryProps } from "./BookingDetailSummary.interface";

export const BookingDetailSummary = ({
  detail,
}: BookingDetailSummaryProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const fields = [
    { label: t("myBookings.detail.business"), value: detail.businessName },
    { label: t("myBookings.detail.service"), value: detail.serviceName },
    { label: t("myBookings.detail.startsAt"), value: detail.startsAtLabel },
    { label: t("myBookings.detail.endsAt"), value: detail.endsAtLabel },
    {
      label: t("myBookings.detail.duration"),
      value: t("myBookings.detail.durationValue", {
        count: detail.durationMinutes,
      }),
    },
    { label: t("myBookings.detail.price"), value: detail.priceLabel },
    {
      label: t("myBookings.detail.collaborator"),
      value: detail.collaboratorName ?? t("myBookings.detail.businessResource"),
    },
  ];

  return (
    <Card>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div className="flex flex-col gap-1" key={field.label}>
              <dt className="text-sm text-muted-foreground">{field.label}</dt>
              <dd className="font-medium text-foreground">{field.value}</dd>
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">
              {t("myBookings.detail.status")}
            </dt>
            <dd>
              <StatusBadge tone={BOOKING_STATUS_TONE[detail.status]}>
                <BookingStatusLabel status={detail.status} />
              </StatusBadge>
            </dd>
          </div>
          {detail.status === BOOKING_STATUS.CANCELLED &&
            detail.cancellation && (
              <div className="flex flex-col gap-1">
                <dt className="text-sm text-muted-foreground">
                  {t("myBookings.detail.cancellation.label")}
                </dt>
                <dd className="font-medium text-foreground">
                  {t(
                    `myBookings.detail.cancellation.cancelledBy.${detail.cancellation.cancelledBy}`,
                  )}
                  {" · "}
                  {detail.cancellation.isPenalized
                    ? t("myBookings.detail.cancellation.penalized")
                    : t("myBookings.detail.cancellation.notPenalized")}
                </dd>
              </div>
            )}
        </dl>
      </CardContent>
    </Card>
  );
};
