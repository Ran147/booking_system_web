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
import type { Booking } from "@/domain";
import { useRescheduleBookingViewModel } from "@/modules/business/features/schedule";
import type { Nullable } from "@/types";

interface RescheduleBookingDialogProps {
  readonly booking: Nullable<Booking>;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export const RescheduleBookingDialog = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: RescheduleBookingDialogProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
    closeForm,
    date,
    errorMessage,
    isRescheduling,
    submitForm,
    time,
    updateDate,
    updateTime,
  } = useRescheduleBookingViewModel({ booking, onClose, onSuccess });

  return (
    <Modal
      isOpen={isOpen && Boolean(booking)}
      title={t("schedule.bookings.rescheduleTitle")}
      onClose={closeForm}
    >
      <form
        className="flex flex-col gap-4 mt-2"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submitForm();
        }}
      >
        {errorMessage && (
          <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>{errorMessage}</Alert>
        )}

        <p className="text-sm text-muted-foreground">
          {t("schedule.bookings.service")}:{" "}
          <strong className="text-foreground">
            {booking?.serviceSnapshot.name}
          </strong>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField
            label={t("schedule.bookings.date")}
            required
            type="date"
            value={date}
            onChange={(event) => updateDate(event.target.value)}
          />
          <InputField
            label={t("schedule.bookings.time")}
            required
            type="time"
            value={time}
            onChange={(event) => updateTime(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border">
          <Button variant={BUTTON_VARIANT.OUTLINE} onClick={closeForm}>
            {t("common:actions.cancel", { defaultValue: "Cancelar" })}
          </Button>
          <Button
            disabled={isRescheduling}
            isLoading={isRescheduling}
            type="submit"
            variant={BUTTON_VARIANT.PRIMARY}
          >
            {t("schedule.bookings.rescheduleAction")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
