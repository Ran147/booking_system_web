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
import { BOOKING_STATUS_TONE, type Booking } from "@/domain";
import { formatDateTime, formatPrice } from "@/utils";

interface BookingListTableProps {
  readonly bookings: readonly Booking[];
  readonly isLoading?: boolean;
  readonly onSelectBooking: (booking: Booking) => void;
}

export const BookingListTable = ({
  bookings,
  isLoading = false,
  onSelectBooking,
}: BookingListTableProps): ReactElement => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  if (bookings.length === 0 && !isLoading) {
    return <EmptyState message={t("schedule.bookingList.emptyDescription")} />;
  }

  return (
    <div className="overflow-x-auto">
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
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">
                <span className="text-sm">
                  {formatDateTime(booking.startsAt, "UTC", i18n.language)}
                </span>
              </TableCell>
              <TableCell>{booking.customerId}</TableCell>
              <TableCell>{booking.serviceSnapshot.name}</TableCell>
              <TableCell>
                {formatPrice(
                  booking.serviceSnapshot.priceInCents,
                  "CRC",
                  i18n.language,
                )}
              </TableCell>
              <TableCell>
                <StatusBadge tone={BOOKING_STATUS_TONE[booking.status]}>
                  <BookingStatusLabel status={booking.status} />
                </StatusBadge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  ariaLabel={t("schedule.bookingList.viewDetail", {
                    defaultValue: "Ver detalle",
                  })}
                  size={BUTTON_SIZE.ICON}
                  variant={BUTTON_VARIANT.GHOST}
                  onClick={() => onSelectBooking(booking)}
                >
                  <Eye className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
