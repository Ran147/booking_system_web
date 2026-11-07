import {
  Calendar,
  CheckCircle2,
  Clock,
  User,
  UserX,
  XCircle,
} from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  BookingStatusLabel,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Modal,
  StatusBadge,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { BOOKING_STATUS, BOOKING_STATUS_TONE, type Booking } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import { useUpdateBookingStatusMutation } from "@/modules/business/features/schedule";
import type { Nullable } from "@/types";
import { formatDateTime, formatPrice } from "@/utils";

interface BookingDetailDrawerProps {
  readonly booking: Nullable<Booking>;
  readonly hasStarted?: boolean;
  readonly isOpen: boolean;
  readonly onCancelClick: () => void;
  readonly onClose: () => void;
  readonly onRescheduleClick: () => void;
  readonly onSuccess?: () => void;
  readonly timeZone?: string;
}

export const BookingDetailDrawer = ({
  booking,
  hasStarted = false,
  isOpen,
  onCancelClick,
  onClose,
  onRescheduleClick,
  onSuccess,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}: BookingDetailDrawerProps): ReactElement => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const { businessId } = useCurrentBusiness();
  const updateStatusMutation = useUpdateBookingStatusMutation();

  if (!booking) {
    return <></>;
  }

  const isPending = booking.status === BOOKING_STATUS.PENDING;
  const isConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;
  const canCompleteOrNoShow = isConfirmed && hasStarted;
  const canReschedule = (isPending || isConfirmed) && !hasStarted;
  const canCancel = isPending || isConfirmed;

  const handleUpdateStatus = async (
    targetStatus: "confirmed" | "completed" | "no_show",
  ): Promise<void> => {
    try {
      await updateStatusMutation.mutateAsync({
        bookingId: booking.id,
        businessId,
        targetStatus,
      });
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      // Invalidate queries will handle refresh
    }
  };

  const formattedPrice = formatPrice(
    booking.serviceSnapshot.priceInCents,
    "CRC",
    i18n.language,
  );

  const formattedDate = formatDateTime(
    booking.startsAt,
    timeZone,
    i18n.language,
  );

  return (
    <Modal
      isOpen={isOpen && Boolean(booking)}
      title={booking.serviceSnapshot.name}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t("schedule.bookings.statusLabel")}:
            </span>
            <StatusBadge tone={BOOKING_STATUS_TONE[booking.status]}>
              <BookingStatusLabel status={booking.status} />
            </StatusBadge>
          </div>
          <span className="text-base font-semibold text-foreground">
            {formattedPrice}
          </span>
        </div>

        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <User className="size-4 text-primary" />
            <span className="text-muted-foreground">
              {t("schedule.bookings.customer")}:
            </span>
            <span className="font-medium">{booking.customerId}</span>
          </div>

          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="size-4 text-primary" />
            <span className="text-muted-foreground">
              {t("schedule.bookings.date")}:
            </span>
            <span className="font-medium">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-foreground">
            <Clock className="size-4 text-primary" />
            <span className="text-muted-foreground">
              {t("schedule.bookings.time")}:
            </span>
            <span className="font-medium">
              {t("schedule.bookings.durationMinutes", {
                minutes: booking.serviceSnapshot.durationMinutes,
              })}
            </span>
          </div>

          {booking.collaboratorName && (
            <div className="flex items-center gap-2 text-foreground">
              <span className="text-muted-foreground">
                {t("schedule.bookings.collaborator")}:
              </span>
              <span className="font-medium">{booking.collaboratorName}</span>
            </div>
          )}
        </div>

        {booking.rescheduleHistory.length > 0 && (
          <div className="mt-2 p-3 bg-muted/40 rounded-lg flex flex-col gap-1.5 border border-border">
            <span className="text-xs font-semibold text-foreground">
              {t("schedule.bookings.historyTitle")}
            </span>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {booking.rescheduleHistory.map((historyItem, index) => (
                <div key={index}>
                  {t("schedule.bookings.rescheduledFrom")}{" "}
                  {formatDateTime(
                    historyItem.previousStartsAt,
                    timeZone,
                    i18n.language,
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {booking.cancellation && (
          <div className="mt-2 p-3 bg-destructive/10 rounded-lg flex flex-col gap-1 text-xs border border-destructive/20 text-destructive">
            <span className="font-semibold">
              {t("schedule.bookings.cancelledBy", {
                actor: booking.cancellation.cancelledBy,
              })}
            </span>
            {booking.cancellation.note && (
              <span>
                {t("schedule.bookings.cancellationNote", {
                  note: booking.cancellation.note,
                })}
              </span>
            )}
            {booking.cancellation.isPenalized && (
              <span className="font-medium">
                {t("schedule.bookings.withPenalty")}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
          {isPending && (
            <Button
              disabled={updateStatusMutation.isPending}
              leftIcon={CheckCircle2}
              size={BUTTON_SIZE.SM}
              variant={BUTTON_VARIANT.PRIMARY}
              onClick={() => handleUpdateStatus("confirmed")}
            >
              {t("schedule.bookings.confirmAction")}
            </Button>
          )}

          {canCompleteOrNoShow && (
            <>
              <Button
                disabled={updateStatusMutation.isPending}
                leftIcon={CheckCircle2}
                size={BUTTON_SIZE.SM}
                variant={BUTTON_VARIANT.OUTLINE}
                onClick={() => handleUpdateStatus("completed")}
              >
                {t("schedule.bookings.completeAction")}
              </Button>
              <Button
                disabled={updateStatusMutation.isPending}
                leftIcon={UserX}
                size={BUTTON_SIZE.SM}
                variant={BUTTON_VARIANT.OUTLINE}
                onClick={() => handleUpdateStatus("no_show")}
              >
                {t("schedule.bookings.noShowAction")}
              </Button>
            </>
          )}

          {canReschedule && (
            <Button
              size={BUTTON_SIZE.SM}
              variant={BUTTON_VARIANT.OUTLINE}
              onClick={onRescheduleClick}
            >
              {t("schedule.bookings.rescheduleAction")}
            </Button>
          )}

          {canCancel && (
            <Button
              leftIcon={XCircle}
              size={BUTTON_SIZE.SM}
              variant={BUTTON_VARIANT.DESTRUCTIVE}
              onClick={onCancelClick}
            >
              {t("schedule.bookings.cancelAction")}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
