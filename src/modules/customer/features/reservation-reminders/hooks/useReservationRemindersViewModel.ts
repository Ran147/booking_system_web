import { useState } from "react";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import type { Nullable } from "@/types";
import { useBookingReminderPreferenceQuery } from "../api/useReservationReminderPreferenceQuery";
import { useUpdateBookingReminderPreferenceMutation } from "../api/useUpdateReservationReminderPreferenceMutation";
import type { BookingRemindersViewModel } from "../models/ReservationRemindersViewModel.interface";

export const useBookingRemindersViewModel = (): BookingRemindersViewModel => {
  const session = useSession();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";
  const preferenceQuery = useBookingReminderPreferenceQuery(userId);
  const preferenceMutation = useUpdateBookingReminderPreferenceMutation();
  const [optimisticValue, setOptimisticValue] =
    useState<Nullable<boolean>>(null);
  const isEnabled = optimisticValue ?? preferenceQuery.data ?? true;

  const handleToggle = (): void => {
    if (!userId || preferenceMutation.isPending) return;

    const previousValue = isEnabled;
    const nextValue = !previousValue;
    setOptimisticValue(nextValue);
    preferenceMutation.mutate(
      { isEnabled: nextValue, userId },
      { onError: () => setOptimisticValue(previousValue) },
    );
  };

  return {
    handleToggle,
    isEnabled,
    isLoading: preferenceQuery.isPending,
    isSaveError: preferenceQuery.isError || preferenceMutation.isError,
    isSaving: preferenceMutation.isPending,
  };
};
