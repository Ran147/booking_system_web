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
import { useScheduleBlockDialogViewModel } from "@/modules/business/features/schedule";
import { SCHEDULE_BLOCK_DIALOG_CONFIG } from "./ScheduleBlockDialog.constants";
import type { ScheduleBlockDialogProps } from "./ScheduleBlockDialog.types";

export const ScheduleBlockDialog = ({
  viewModel,
}: ScheduleBlockDialogProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const {
    closeDialog,
    endDateValue,
    endTimeValue,
    errorMessage,
    handleEndDateChange,
    handleEndTimeChange,
    handleFullDayChange,
    handleReasonChange,
    handleStartDateChange,
    handleStartTimeChange,
    handleSubmit,
    isCreating,
    isDialogOpen,
    isFullDay,
    reasonValue,
    startDateValue,
    startTimeValue,
  } = useScheduleBlockDialogViewModel(viewModel);

  return (
    <Modal
      isOpen={isDialogOpen}
      title={t("schedule.blocks.newBlockAction")}
      onClose={closeDialog}
    >
      <form
        className="flex flex-col gap-4 mt-2"
        noValidate
        onSubmit={handleSubmit}
      >
        {errorMessage && (
          <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>{errorMessage}</Alert>
        )}

        <div className="flex items-center gap-2">
          <CheckboxField
            checked={isFullDay}
            label={t("schedule.blocks.allDay")}
            onChange={handleFullDayChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField
            label={t("schedule.blocks.startDate")}
            required
            type={SCHEDULE_BLOCK_DIALOG_CONFIG.DATE_INPUT_TYPE}
            value={startDateValue}
            onChange={handleStartDateChange}
          />
          <InputField
            label={t("schedule.blocks.endDate")}
            required
            type={SCHEDULE_BLOCK_DIALOG_CONFIG.DATE_INPUT_TYPE}
            value={endDateValue}
            onChange={handleEndDateChange}
          />
        </div>

        {!isFullDay && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label={t("schedule.blocks.startTime")}
              required
              type={SCHEDULE_BLOCK_DIALOG_CONFIG.TIME_INPUT_TYPE}
              value={startTimeValue}
              onChange={handleStartTimeChange}
            />
            <InputField
              label={t("schedule.blocks.endTime")}
              required
              type={SCHEDULE_BLOCK_DIALOG_CONFIG.TIME_INPUT_TYPE}
              value={endTimeValue}
              onChange={handleEndTimeChange}
            />
          </div>
        )}

        <InputField
          label={t("schedule.blocks.reason")}
          placeholder={t("schedule.blocks.reasonPlaceholder")}
          value={reasonValue}
          onChange={handleReasonChange}
        />

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border">
          <Button variant={BUTTON_VARIANT.OUTLINE} onClick={closeDialog}>
            {t("common:actions.cancel")}
          </Button>
          <Button
            disabled={isCreating}
            isLoading={isCreating}
            type={SCHEDULE_BLOCK_DIALOG_CONFIG.SUBMIT_BUTTON_TYPE}
            variant={BUTTON_VARIANT.PRIMARY}
          >
            {t("schedule.blocks.saveAction")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
