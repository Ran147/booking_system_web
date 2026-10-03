import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { BookingStatus } from "@/shared/domain";

export interface BookingStatusLabelProps {
  status: BookingStatus;
}

export const BookingStatusLabel = ({
  status,
}: BookingStatusLabelProps): ReactElement => {
  const { t } = useTranslation();

  return <span>{t(`bookingStatus.${status}`)}</span>;
};
