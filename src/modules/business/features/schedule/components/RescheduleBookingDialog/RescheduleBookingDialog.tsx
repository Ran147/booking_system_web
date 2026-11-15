import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_VARIANT,
  InputField,
  Modal,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { useRescheduleBookingViewModel } from "@/modules/business/features/schedule";
import { RESCHEDULE_BOOKING_DIALOG_CONFIG } from "./RescheduleBookingDialog.constants";
import type { RescheduleBookingDialogProps } from "./RescheduleBookingDialog.types";

export const RescheduleBookingDialog = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: RescheduleBookingDialogProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const {
    closeForm,
    date,
    errorMessage,
    handleDateChange,
    handleSubmit,
    handleTimeChange,
    isModalOpen,
    isRescheduling,
    serviceName,
    time,
  } = useRescheduleBookingViewModel({ booking, isOpen, onClose, onSuccess });

  return (
    <Modal
      isOpen={isModalOpen}
      title={t("schedule.bookings.rescheduleTitle")}
      onClose={closeForm}
    >
      <form
        className="flex flex-col gap-4 mt-2"
        noValidate
        onSubmit={handleSubmit}
      >
        {errorMessage && (
          <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>{errorMessage}</Alert>
        )}

        <p className="text-sm text-muted-foreground">
          {t("schedule.bookings.service")}:{" "}
          <strong className="text-foreground">{serviceName}</strong>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField
            label={t("schedule.bookings.date")}
            required
            type={RESCHEDULE_BOOKING_DIALOG_CONFIG.DATE_INPUT_TYPE}
            value={date}
            onChange={handleDateChange}
          />
          <InputField
            label={t("schedule.bookings.time")}
            required
            type={RESCHEDULE_BOOKING_DIALOG_CONFIG.TIME_INPUT_TYPE}
            value={time}
            onChange={handleTimeChange}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border">
          <Button variant={BUTTON_VARIANT.OUTLINE} onClick={closeForm}>
            {t("common:actions.cancel")}
          </Button>
          <Button
            disabled={isRescheduling}
            isLoading={isRescheduling}
            type={RESCHEDULE_BOOKING_DIALOG_CONFIG.SUBMIT_BUTTON_TYPE}
            variant={BUTTON_VARIANT.PRIMARY}
          >
            {t("schedule.bookings.rescheduleAction")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
