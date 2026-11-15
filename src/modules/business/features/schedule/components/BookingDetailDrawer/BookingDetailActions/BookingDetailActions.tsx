import { CheckCircle2, UserX, XCircle } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, BUTTON_VARIANT } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { BOOKING_DETAIL_ACTIONS_CONFIG } from "./BookingDetailActions.constants";
import type { BookingDetailActionsProps } from "./BookingDetailActions.types";

export const BookingDetailActions = ({
  canCancel,
  canCompleteOrNoShow,
  canConfirm,
  canReschedule,
  isUpdatingStatus,
  onCancelClick,
  onComplete,
  onConfirm,
  onMarkNoShow,
  onRescheduleClick,
}: BookingDetailActionsProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
      {canConfirm && (
        <Button
          disabled={isUpdatingStatus}
          leftIcon={CheckCircle2}
          size={BOOKING_DETAIL_ACTIONS_CONFIG.ACTION_BUTTON_SIZE}
          variant={BUTTON_VARIANT.PRIMARY}
          onClick={onConfirm}
        >
          {t("schedule.bookings.confirmAction")}
        </Button>
      )}

      {canCompleteOrNoShow && (
        <>
          <Button
            disabled={isUpdatingStatus}
            leftIcon={CheckCircle2}
            size={BOOKING_DETAIL_ACTIONS_CONFIG.ACTION_BUTTON_SIZE}
            variant={BUTTON_VARIANT.OUTLINE}
            onClick={onComplete}
          >
            {t("schedule.bookings.completeAction")}
          </Button>
          <Button
            disabled={isUpdatingStatus}
            leftIcon={UserX}
            size={BOOKING_DETAIL_ACTIONS_CONFIG.ACTION_BUTTON_SIZE}
            variant={BUTTON_VARIANT.OUTLINE}
            onClick={onMarkNoShow}
          >
            {t("schedule.bookings.noShowAction")}
          </Button>
        </>
      )}

      {canReschedule && (
        <Button
          size={BOOKING_DETAIL_ACTIONS_CONFIG.ACTION_BUTTON_SIZE}
          variant={BUTTON_VARIANT.OUTLINE}
          onClick={onRescheduleClick}
        >
          {t("schedule.bookings.rescheduleAction")}
        </Button>
      )}

      {canCancel && (
        <Button
          leftIcon={XCircle}
          size={BOOKING_DETAIL_ACTIONS_CONFIG.ACTION_BUTTON_SIZE}
          variant={BUTTON_VARIANT.DESTRUCTIVE}
          onClick={onCancelClick}
        >
          {t("schedule.bookings.cancelAction")}
        </Button>
      )}
    </div>
  );
};

