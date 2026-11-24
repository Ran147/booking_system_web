import { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { RadioGroupOption } from "@/components/common";
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
  BUSINESS_HOURS_DEFAULT_RANGE,
  BUSINESS_HOURS_FIELD,
  DAYS_OF_WEEK,
  SCHEDULE_CONSTANTS,
  type BookingConfirmationMode,
  type BusinessHoursField,
  type DayOfWeek,
} from "../constants";
import type { BusinessHours, DayTimeRange } from "../models";

export interface DayHoursState {
  readonly isOpen: boolean;
  readonly ranges: DayTimeRange[];
}

export type BusinessHoursFormState = Record<DayOfWeek, DayHoursState>;

export interface BusinessHoursDayRangeRow {
  readonly closesAt: string;
  readonly id: string;
  readonly onClosesAtChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onOpensAtChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onRemove: () => void;
  readonly opensAt: string;
}

export interface BusinessHoursDayRow {
  readonly canAddRange: boolean;
  readonly canRemoveRange: boolean;
  readonly day: DayOfWeek;
  readonly isOpen: boolean;
  readonly onAddRange: () => void;
  readonly onToggleOpen: () => void;
  readonly ranges: readonly BusinessHoursDayRangeRow[];
}

export interface BusinessHoursViewModelResult {
  readonly addRange: (day: DayOfWeek) => void;
  readonly confirmationMode: BookingConfirmationMode;
  readonly confirmationOptions: readonly RadioGroupOption[];
  readonly dayRows: readonly BusinessHoursDayRow[];
  readonly errorMessage: Nullable<string>;
  readonly formState: BusinessHoursFormState;
  readonly handleConfirmationModeChange: (value: string) => void;
  readonly handleSaveConfirmationMode: () => void;
  readonly handleSaveHours: () => void;
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
    field: BusinessHoursField,
    value: string,
  ) => void;
}

const createInitialDayState = (
  ranges: readonly DayTimeRange[] = [],
): DayHoursState => ({
  isOpen: ranges.length > 0,
  ranges:
    ranges.length > 0
      ? [...ranges]
      : [
          {
            closesAt: BUSINESS_HOURS_DEFAULT_RANGE.INITIAL_CLOSES_AT,
            opensAt: BUSINESS_HOURS_DEFAULT_RANGE.INITIAL_OPENS_AT,
          },
        ],
});

const createInitialFormState = (
  businessHours?: BusinessHours,
): BusinessHoursFormState =>
  DAYS_OF_WEEK.reduce((accumulator, day) => {
    accumulator[day] = createInitialDayState(businessHours?.[day]);
    return accumulator;
  }, {} as BusinessHoursFormState);

export const useBusinessHoursViewModel = (): BusinessHoursViewModelResult => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
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
        ranges: [
          ...currentRanges,
          {
            closesAt: BUSINESS_HOURS_DEFAULT_RANGE.SECOND_SHIFT_CLOSES_AT,
            opensAt: BUSINESS_HOURS_DEFAULT_RANGE.SECOND_SHIFT_OPENS_AT,
          },
        ],
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
    field: BusinessHoursField,
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

    for (const day of DAYS_OF_WEEK) {
      const daySchedule = formState[day];
      if (!daySchedule.isOpen) {
        continue;
      }
      for (const range of daySchedule.ranges) {
        if (range.opensAt >= range.closesAt) {
          setErrorMessage(t("schedule.hours.invalidRangeError"));
          return;
        }
      }
      if (
        daySchedule.ranges.length ===
        SCHEDULE_CONSTANTS.MAX_HOURS_RANGES_PER_DAY
      ) {
        const firstRange = daySchedule.ranges[0];
        const secondRange = daySchedule.ranges[1];
        if (
          firstRange &&
          secondRange &&
          firstRange.closesAt > secondRange.opensAt
        ) {
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
      setErrorMessage(t("common:errors.network"));
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
      setErrorMessage(t("common:errors.network"));
    }
  };

  const handleSaveHours = (): void => {
    void saveHours();
  };

  const handleSaveConfirmationMode = (): void => {
    void saveConfirmationMode();
  };

  const handleConfirmationModeChange = (value: string): void => {
    setEditedConfirmationMode(value as BookingConfirmationMode);
  };

  const dayRows: readonly BusinessHoursDayRow[] = DAYS_OF_WEEK.map((day) => {
    const daySchedule = formState[day];
    return {
      canAddRange:
        daySchedule.isOpen &&
        daySchedule.ranges.length < SCHEDULE_CONSTANTS.MAX_HOURS_RANGES_PER_DAY,
      canRemoveRange: daySchedule.ranges.length > 1,
      day,
      isOpen: daySchedule.isOpen,
      onAddRange: (): void => addRange(day),
      onToggleOpen: (): void => toggleDayOpen(day),
      ranges: daySchedule.ranges.map((range, rangeIndex) => ({
        closesAt: range.closesAt,
        id: `${day}-range-${rangeIndex}`,
        onClosesAtChange: (event: ChangeEvent<HTMLInputElement>): void =>
          updateRange(
            day,
            rangeIndex,
            BUSINESS_HOURS_FIELD.CLOSES_AT,
            event.target.value,
          ),
        onOpensAtChange: (event: ChangeEvent<HTMLInputElement>): void =>
          updateRange(
            day,
            rangeIndex,
            BUSINESS_HOURS_FIELD.OPENS_AT,
            event.target.value,
          ),
        onRemove: (): void => removeRange(day, rangeIndex),
        opensAt: range.opensAt,
      })),
    };
  });

  const confirmationOptions: readonly RadioGroupOption[] = [
    {
      description: t("schedule.confirmation.automaticDescription"),
      label: t("schedule.confirmation.automaticLabel"),
      value: BOOKING_CONFIRMATION_MODE.AUTOMATIC,
    },
    {
      description: t("schedule.confirmation.manualDescription"),
      label: t("schedule.confirmation.manualLabel"),
      value: BOOKING_CONFIRMATION_MODE.MANUAL,
    },
  ];

  const rawTimeZone = hoursQuery.data?.timeZone;
  const resolvedTimeZone =
    !rawTimeZone ||
    rawTimeZone.includes(SCHEDULE_CONSTANTS.LEGACY_TIME_ZONE_SUBSTRING)
      ? SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE
      : rawTimeZone;

  return {
    addRange,
    confirmationMode,
    confirmationOptions,
    dayRows,
    errorMessage,
    formState,
    handleConfirmationModeChange,
    handleSaveConfirmationMode,
    handleSaveHours,
    isSaving:
      updateHoursMutation.isPending || updateConfirmationMutation.isPending,
    removeRange,
    saveConfirmationMode,
    saveHours,
    setConfirmationMode: setEditedConfirmationMode,
    successMessage,
    timeZone: resolvedTimeZone,
    toggleDayOpen,
    updateRange,
  };
};
