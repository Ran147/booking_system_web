import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_VARIANT,
  CheckboxField,
  Modal,
  TextareaField,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { useCancelBookingViewModel } from "@/modules/business/features/schedule";
import { CANCEL_BOOKING_DIALOG_CONFIG } from "./CancelBookingDialog.constants";
import type { CancelBookingDialogProps } from "./CancelBookingDialog.types";

export const CancelBookingDialog = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: CancelBookingDialogProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const {
    closeForm,
    errorMessage,
    handleNoteChange,
    handlePenalizedChange,
    handleSubmit,
    isCancelling,
    isModalOpen,
    isPenalized,
    note,
    serviceName,
  } = useCancelBookingViewModel({ booking, isOpen, onClose, onSuccess });

  return (
    <Modal
      isOpen={isModalOpen}
      title={t("schedule.bookings.cancelTitle")}
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

        <TextareaField
          label={t("schedule.bookings.noteLabel")}
          maxLength={CANCEL_BOOKING_DIALOG_CONFIG.NOTE_MAX_LENGTH}
          placeholder={t("schedule.bookings.notePlaceholder")}
          required
          rows={CANCEL_BOOKING_DIALOG_CONFIG.NOTE_ROWS}
          showCharacterCount
          value={note}
          onChange={handleNoteChange}
        />

        <div className="flex flex-col gap-1 p-3 rounded-lg border border-border bg-muted/30">
          <CheckboxField
            checked={isPenalized}
            label={t("schedule.bookings.penaltyLabel")}
            onChange={handlePenalizedChange}
          />
          <span className="text-xs text-muted-foreground ml-6">
            {t("schedule.bookings.penaltyDescription")}
          </span>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border">
          <Button variant={BUTTON_VARIANT.OUTLINE} onClick={closeForm}>
            {t("common:actions.cancel")}
          </Button>
          <Button
            disabled={isCancelling}
            isLoading={isCancelling}
            type={CANCEL_BOOKING_DIALOG_CONFIG.SUBMIT_BUTTON_TYPE}
            variant={BUTTON_VARIANT.DESTRUCTIVE}
          >
            {t("schedule.bookings.cancelAction")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
