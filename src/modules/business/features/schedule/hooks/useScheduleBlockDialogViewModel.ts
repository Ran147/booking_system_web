import type { ChangeEvent, FormEvent } from "react";
import { STRING } from "@/constants";
import { SCHEDULE_BLOCK_DEFAULT_TIME } from "../constants";
import type { ScheduleBlockViewModelResult } from "./useScheduleBlockViewModel";

export interface ScheduleBlockDialogViewModelResult {
  readonly closeDialog: () => void;
  readonly endDateValue: string;
  readonly endTimeValue: string;
  readonly errorMessage: ScheduleBlockViewModelResult["errorMessage"];
  readonly handleEndDateChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly handleEndTimeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly handleFullDayChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly handleReasonChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly handleStartDateChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  readonly handleStartTimeChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  readonly handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly isCreating: boolean;
  readonly isDialogOpen: boolean;
  readonly isFullDay: boolean;
  readonly reasonValue: string;
  readonly startDateValue: string;
  readonly startTimeValue: string;
}

export const useScheduleBlockDialogViewModel = (
  viewModel: ScheduleBlockViewModelResult,
): ScheduleBlockDialogViewModelResult => {
  const {
    closeDialog,
    errorMessage,
    formData,
    isCreating,
    isDialogOpen,
    submitBlock,
    updateFormField,
  } = viewModel;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void submitBlock();
  };

  const handleFullDayChange = (event: ChangeEvent<HTMLInputElement>): void => {
    updateFormField("isFullDay", event.target.checked);
  };

  const handleStartDateChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    updateFormField("startDate", event.target.value);
  };

  const handleEndDateChange = (event: ChangeEvent<HTMLInputElement>): void => {
    updateFormField("endDate", event.target.value);
  };

  const handleStartTimeChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    updateFormField("startTime", event.target.value);
  };

  const handleEndTimeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    updateFormField("endTime", event.target.value);
  };

  const handleReasonChange = (event: ChangeEvent<HTMLInputElement>): void => {
    updateFormField("reason", event.target.value);
  };

  return {
    closeDialog,
    endDateValue: formData.endDate,
    endTimeValue:
      formData.endTime ?? SCHEDULE_BLOCK_DEFAULT_TIME.FALLBACK_END_TIME,
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
    isFullDay: formData.isFullDay,
    reasonValue: formData.reason ?? STRING.EMPTY,
    startDateValue: formData.startDate,
    startTimeValue:
      formData.startTime ?? SCHEDULE_BLOCK_DEFAULT_TIME.FALLBACK_START_TIME,
  };
};

