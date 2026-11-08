import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import {
  useBusinessHoursQuery,
  useUpdateBusinessHoursMutation,
  useUpdateConfirmationModeMutation,
} from "../api";
import {
  BOOKING_CONFIRMATION_MODE,
  DAYS_OF_WEEK,
  SCHEDULE_CONSTANTS,
  type BookingConfirmationMode,
  type DayOfWeek,
} from "../constants";
import type { BusinessHours, DayTimeRange } from "../models";

export interface DayHoursState {
  readonly isOpen: boolean;
  readonly ranges: DayTimeRange[];
}

export type BusinessHoursFormState = Record<DayOfWeek, DayHoursState>;

export interface BusinessHoursViewModelResult {
  readonly addRange: (day: DayOfWeek) => void;
  readonly confirmationMode: BookingConfirmationMode;
  readonly errorMessage: Nullable<string>;
  readonly formState: BusinessHoursFormState;
  readonly isSaving: boolean;
  readonly removeRange: (day: DayOfWeek, index: number) => void;
  readonly saveConfirmationMode: () => Promise<void>;
  readonly saveHours: () => Promise<void>;
  readonly setConfirmationMode: (mode: BookingConfirmationMode) => void;
  readonly successMessage: Nullable<string>;
  readonly timeZone: string;
  readonly toggleDayOpen: (day: DayOfWeek) => void;
  readonly updateRange: (
    day: DayOfWeek,
    index: number,
    field: keyof DayTimeRange,
    value: string,
  ) => void;
}

const createInitialDayState = (
  ranges: readonly DayTimeRange[] = [],
): DayHoursState => ({
  isOpen: ranges.length > 0,
  ranges:
    ranges.length > 0 ? [...ranges] : [{ closesAt: "17:00", opensAt: "09:00" }],
});

const createInitialFormState = (
  businessHours?: BusinessHours,
): BusinessHoursFormState => {
  return DAYS_OF_WEEK.reduce((accumulator, day) => {
    accumulator[day] = createInitialDayState(businessHours?.[day]);
    return accumulator;
  }, {} as BusinessHoursFormState);
};

export const useBusinessHoursViewModel = (): BusinessHoursViewModelResult => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const { businessId } = useCurrentBusiness();

  const hoursQuery = useBusinessHoursQuery(businessId);
  const updateHoursMutation = useUpdateBusinessHoursMutation();
  const updateConfirmationMutation = useUpdateConfirmationModeMutation();

  const [editedFormState, setEditedFormState] =
    useState<Nullable<BusinessHoursFormState>>(null);
  const [editedConfirmationMode, setEditedConfirmationMode] =
    useState<Nullable<BookingConfirmationMode>>(null);
  const [errorMessage, setErrorMessage] = useState<Nullable<string>>(null);
  const [successMessage, setSuccessMessage] = useState<Nullable<string>>(null);

  const formState: BusinessHoursFormState =
    editedFormState ??
    (hoursQuery.data
      ? createInitialFormState(hoursQuery.data.businessHours)
      : createInitialFormState());

  const confirmationMode: BookingConfirmationMode =
    editedConfirmationMode ??
    hoursQuery.data?.confirmationMode ??
    BOOKING_CONFIRMATION_MODE.AUTOMATIC;

  const toggleDayOpen = (day: DayOfWeek): void => {
    const currentFormState = { ...formState };
    setEditedFormState({
      ...currentFormState,
      [day]: {
        ...currentFormState[day],
        isOpen: !currentFormState[day].isOpen,
      },
    });
  };

  const addRange = (day: DayOfWeek): void => {
    const currentFormState = { ...formState };
    const currentRanges = currentFormState[day].ranges;
    if (currentRanges.length >= SCHEDULE_CONSTANTS.MAX_HOURS_RANGES_PER_DAY) {
      return;
    }
    setEditedFormState({
      ...currentFormState,
      [day]: {
        ...currentFormState[day],
        ranges: [...currentRanges, { closesAt: "19:00", opensAt: "14:00" }],
      },
    });
  };

  const removeRange = (day: DayOfWeek, index: number): void => {
    const currentFormState = { ...formState };
    setEditedFormState({
      ...currentFormState,
      [day]: {
        ...currentFormState[day],
        ranges: currentFormState[day].ranges.filter(
          (_, rangeIndex) => rangeIndex !== index,
        ),
      },
    });
  };

  const updateRange = (
    day: DayOfWeek,
    index: number,
    field: keyof DayTimeRange,
    value: string,
  ): void => {
    const currentFormState = { ...formState };
    const updatedRanges = currentFormState[day].ranges.map(
      (range, rangeIndex) => {
        if (rangeIndex === index) {
          return { ...range, [field]: value };
        }
        return range;
      },
    );
    setEditedFormState({
      ...currentFormState,
      [day]: {
        ...currentFormState[day],
        ranges: updatedRanges,
      },
    });
  };

  const saveHours = async (): Promise<void> => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate ranges
    for (const day of DAYS_OF_WEEK) {
      const dayData = formState[day];
      if (!dayData.isOpen) {
        continue;
      }
      for (const range of dayData.ranges) {
        if (range.opensAt >= range.closesAt) {
          setErrorMessage(t("schedule.hours.invalidRangeError"));
          return;
        }
      }
      if (
        dayData.ranges.length === SCHEDULE_CONSTANTS.MAX_HOURS_RANGES_PER_DAY
      ) {
        const first = dayData.ranges[0];
        const second = dayData.ranges[1];
        if (first && second && first.closesAt > second.opensAt) {
          setErrorMessage(t("schedule.hours.overlappingRangesError"));
          return;
        }
      }
    }

    const payload: BusinessHours = DAYS_OF_WEEK.reduce(
      (accumulator, day) => {
        accumulator[day] = formState[day].isOpen ? formState[day].ranges : [];
        return accumulator;
      },
      {} as Record<DayOfWeek, DayTimeRange[]>,
    );

    try {
      await updateHoursMutation.mutateAsync({
        businessHours: payload,
        businessId,
      });
      setSuccessMessage(t("schedule.hours.saveSuccess"));
      setEditedFormState(null);
    } catch {
      setErrorMessage(
        t("errors.common.network", { defaultValue: "Error de red" }),
      );
    }
  };

  const saveConfirmationMode = async (): Promise<void> => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateConfirmationMutation.mutateAsync({
        businessId,
        mode: confirmationMode,
      });
      setSuccessMessage(t("schedule.confirmation.saveSuccess"));
      setEditedConfirmationMode(null);
    } catch {
      setErrorMessage(
        t("errors.common.network", { defaultValue: "Error de red" }),
      );
    }
  };

  return {
    addRange,
    confirmationMode,
    errorMessage,
    formState,
    isSaving:
      updateHoursMutation.isPending || updateConfirmationMutation.isPending,
    removeRange,
    saveConfirmationMode,
    saveHours,
    setConfirmationMode: setEditedConfirmationMode,
    successMessage,
    timeZone:
      hoursQuery.data?.timeZone || SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
    toggleDayOpen,
    updateRange,
  };
};
