import { Eye } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  BookingStatusLabel,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  EmptyState,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { useBookingTableViewModel } from "@/modules/business/features/schedule";
import { BOOKING_HISTORY_TABLE_CONFIG } from "./BookingHistoryTable.constants";
import type { BookingHistoryTableProps } from "./BookingHistoryTable.types";

export const BookingHistoryTable = ({
  bookings,
  isLoading = false,
  onSelectBooking,
  timeZone,
}: BookingHistoryTableProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const { isEmpty, rows } = useBookingTableViewModel({
    bookings,
    currencyCode: BOOKING_HISTORY_TABLE_CONFIG.DEFAULT_CURRENCY,
    isLoading,
    onSelectBooking,
    timeZone,
  });

  if (isEmpty) {
    return <EmptyState message={t("schedule.history.noResults")} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("schedule.bookingList.tableDate")}</TableHead>
          <TableHead>{t("schedule.bookingList.tableCustomer")}</TableHead>
          <TableHead>{t("schedule.bookingList.tableService")}</TableHead>
          <TableHead>{t("schedule.bookingList.tablePrice")}</TableHead>
          <TableHead>{t("schedule.bookingList.tableStatus")}</TableHead>
          <TableHead className="text-right">
            {t("schedule.bookingList.tableActions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((bookingRow) => (
          <TableRow key={bookingRow.id}>
            <TableCell className="font-medium">
              <span className="text-sm">{bookingRow.formattedDate}</span>
            </TableCell>
            <TableCell>{bookingRow.customerId}</TableCell>
            <TableCell>{bookingRow.serviceName}</TableCell>
            <TableCell>{bookingRow.formattedPrice}</TableCell>
            <TableCell>
              <StatusBadge tone={bookingRow.statusTone}>
                <BookingStatusLabel status={bookingRow.status} />
              </StatusBadge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                ariaLabel={t("schedule.bookingList.viewDetail")}
                size={BUTTON_SIZE.ICON}
                variant={BUTTON_VARIANT.GHOST}
                onClick={bookingRow.onSelect}
              >
                <Eye className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

