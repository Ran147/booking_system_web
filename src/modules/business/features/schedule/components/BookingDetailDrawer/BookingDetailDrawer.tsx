import { Calendar, Clock, User } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { BookingStatusLabel, Modal, StatusBadge } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { useBookingDetailViewModel } from "@/modules/business/features/schedule";
import { BookingDetailActions } from "./BookingDetailActions";
import type { BookingDetailDrawerProps } from "./BookingDetailDrawer.types";

export const BookingDetailDrawer = ({
  booking,
  hasStarted = false,
  isOpen,
  onCancelClick,
  onClose,
  onRescheduleClick,
  onSuccess,
  timeZone,
}: BookingDetailDrawerProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
    bookingTitle,
    cancellation,
    canCancel,
    canCompleteOrNoShow,
    canConfirm,
    canReschedule,
    collaboratorName,
    customerId,
    durationMinutes,
    formattedDate,
    formattedPrice,
    handleCompleteBooking,
    handleConfirmBooking,
    handleMarkNoShow,
    isModalOpen,
    isUpdatingStatus,
    rescheduleHistoryItems,
    status,
    statusTone,
  } = useBookingDetailViewModel({
    booking,
    hasStarted,
    isOpen,
    onClose,
    onSuccess,
    timeZone,
  });

  if (!status) {
    return <></>;
  }

  return (
    <Modal isOpen={isModalOpen} title={bookingTitle} onClose={onClose}>
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t("schedule.bookings.statusLabel")}:
            </span>
            <StatusBadge tone={statusTone}>
              <BookingStatusLabel status={status} />
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
            <span className="font-medium">{customerId}</span>
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
                minutes: durationMinutes,
              })}
            </span>
          </div>

          {collaboratorName && (
            <div className="flex items-center gap-2 text-foreground">
              <span className="text-muted-foreground">
                {t("schedule.bookings.collaborator")}:
              </span>
              <span className="font-medium">{collaboratorName}</span>
            </div>
          )}
        </div>

        {rescheduleHistoryItems.length > 0 && (
          <div className="mt-2 p-3 bg-muted/40 rounded-lg flex flex-col gap-1.5 border border-border">
            <span className="text-xs font-semibold text-foreground">
              {t("schedule.bookings.historyTitle")}
            </span>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {rescheduleHistoryItems.map((historyItem) => (
                <div key={historyItem.id}>
                  {t("schedule.bookings.rescheduledFrom")}{" "}
                  {historyItem.formattedPreviousStartsAt}
                </div>
              ))}
            </div>
          </div>
        )}

        {cancellation && (
          <div className="mt-2 p-3 bg-destructive/10 rounded-lg flex flex-col gap-1 text-xs border border-destructive/20 text-destructive">
            <span className="font-semibold">
              {t("schedule.bookings.cancelledBy", {
                actor: cancellation.cancelledBy,
              })}
            </span>
            {cancellation.note && (
              <span>
                {t("schedule.bookings.cancellationNote", {
                  note: cancellation.note,
                })}
              </span>
            )}
            {cancellation.isPenalized && (
              <span className="font-medium">
                {t("schedule.bookings.withPenalty")}
              </span>
            )}
          </div>
        )}

        <BookingDetailActions
          canCancel={canCancel}
          canCompleteOrNoShow={canCompleteOrNoShow}
          canConfirm={canConfirm}
          canReschedule={canReschedule}
          isUpdatingStatus={isUpdatingStatus}
          onCancelClick={onCancelClick}
          onComplete={handleCompleteBooking}
          onConfirm={handleConfirmBooking}
          onMarkNoShow={handleMarkNoShow}
          onRescheduleClick={onRescheduleClick}
        />
      </div>
    </Modal>
  );
};

