import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_VARIANT,
  InputField,
  Modal,
  SelectField,
  TextareaField,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { useBookingFormViewModel } from "@/modules/business/features/schedule";

interface BookingFormDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export const BookingFormDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: BookingFormDialogProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
    closeForm,
    errorMessage,
    formData,
    isCreating,
    serviceOptions,
    submitForm,
    updateField,
  } = useBookingFormViewModel({ onClose, onSuccess });

  return (
    <Modal
      isOpen={isOpen}
      title={t("schedule.bookings.createTitle")}
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

        <SelectField
          label={t("schedule.bookings.service")}
          options={serviceOptions}
          placeholder={t("schedule.bookings.selectServicePlaceholder")}
          required
          value={formData.serviceId}
          onChange={(event) => updateField("serviceId", event.target.value)}
        />

        <InputField
          helperText={t("schedule.bookings.customerHelper")}
          label={t("schedule.bookings.customer")}
          placeholder={t("schedule.bookings.customerPlaceholder")}
          required
          value={formData.customerId}
          onChange={(event) => updateField("customerId", event.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField
            label={t("schedule.bookings.date")}
            required
            type="date"
            value={formData.date}
            onChange={(event) => updateField("date", event.target.value)}
          />
          <InputField
            label={t("schedule.bookings.time")}
            required
            type="time"
            value={formData.time}
            onChange={(event) => updateField("time", event.target.value)}
          />
        </div>

        <TextareaField
          label={t("schedule.bookings.notes")}
          placeholder={t("schedule.bookings.notesPlaceholder")}
          rows={3}
          value={formData.notes ?? ""}
          onChange={(event) => updateField("notes", event.target.value)}
        />

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border">
          <Button variant={BUTTON_VARIANT.OUTLINE} onClick={closeForm}>
            {t("common:actions.cancel", { defaultValue: "Cancelar" })}
          </Button>
          <Button
            disabled={isCreating}
            isLoading={isCreating}
            type="submit"
            variant={BUTTON_VARIANT.PRIMARY}
          >
            {t("schedule.bookings.saveAction")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
