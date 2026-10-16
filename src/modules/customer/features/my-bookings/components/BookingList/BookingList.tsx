import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  AppLink,
  BookingStatusLabel,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import { BOOKING_STATUS_TONE } from "@/shared/domain";
import type { BookingListProps } from "./BookingList.types";

export const BookingList = ({ rows }: BookingListProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);

  return (
    <Table aria-label={t("myBookings.list.label")}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">{t("myBookings.list.columns.date")}</TableHead>
          <TableHead scope="col">
            {t("myBookings.list.columns.business")}
          </TableHead>
          <TableHead scope="col">
            {t("myBookings.list.columns.service")}
          </TableHead>
          <TableHead scope="col">
            {t("myBookings.list.columns.status")}
          </TableHead>
          <TableHead scope="col">
            <span className="sr-only">
              {t("myBookings.list.columns.actions")}
            </span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.businessName}-${row.id}`}>
            <TableCell>{row.dateTimeLabel}</TableCell>
            <TableCell>{row.businessName}</TableCell>
            <TableCell>{row.serviceName}</TableCell>
            <TableCell>
              <StatusBadge tone={BOOKING_STATUS_TONE[row.status]}>
                <BookingStatusLabel status={row.status} />
              </StatusBadge>
            </TableCell>
            <TableCell className="text-right">
              <AppLink to={row.detailPath}>
                {t("myBookings.list.detailAction")}
              </AppLink>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
