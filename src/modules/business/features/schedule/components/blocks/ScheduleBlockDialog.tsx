import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_VARIANT,
  CheckboxField,
  InputField,
  Modal,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { ScheduleBlockViewModelResult } from "@/modules/business/features/schedule";

interface ScheduleBlockDialogProps {
  readonly viewModel: ScheduleBlockViewModelResult;
}

export const ScheduleBlockDialog = ({
  viewModel,
}: ScheduleBlockDialogProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
    closeDialog,
    errorMessage,
    formData,
    isCreating,
    isDialogOpen,
    submitBlock,
    updateFormField,
  } = viewModel;

  return (
    <Modal
      isOpen={isDialogOpen}
      title={t("schedule.blocks.newBlockAction")}
      onClose={closeDialog}
    >
      <form
        className="flex flex-col gap-4 mt-2"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submitBlock();
        }}
      >
        {errorMessage && (
          <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>{errorMessage}</Alert>
        )}

        <div className="flex items-center gap-2">
          <CheckboxField
            checked={formData.isFullDay}
            label={t("schedule.blocks.allDay")}
            onChange={(event) =>
              updateFormField("isFullDay", event.target.checked)
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField
            label={t("schedule.blocks.startDate")}
            required
            type="date"
            value={formData.startDate}
            onChange={(event) =>
              updateFormField("startDate", event.target.value)
            }
          />
          <InputField
            label={t("schedule.blocks.endDate")}
            required
            type="date"
            value={formData.endDate}
            onChange={(event) => updateFormField("endDate", event.target.value)}
          />
        </div>

        {!formData.isFullDay && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label={t("schedule.blocks.startTime")}
              required
              type="time"
              value={formData.startTime ?? "09:00"}
              onChange={(event) =>
                updateFormField("startTime", event.target.value)
              }
            />
            <InputField
              label={t("schedule.blocks.endTime")}
              required
              type="time"
              value={formData.endTime ?? "10:00"}
              onChange={(event) =>
                updateFormField("endTime", event.target.value)
              }
            />
          </div>
        )}

        <InputField
          label={t("schedule.blocks.reason")}
          placeholder={t("schedule.blocks.reasonPlaceholder")}
          value={formData.reason ?? ""}
          onChange={(event) => updateFormField("reason", event.target.value)}
        />

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border">
          <Button variant={BUTTON_VARIANT.OUTLINE} onClick={closeDialog}>
            {t("common:actions.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            disabled={isCreating}
            isLoading={isCreating}
            type="submit"
            variant={BUTTON_VARIANT.PRIMARY}
          >
            {t("schedule.blocks.saveAction")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
