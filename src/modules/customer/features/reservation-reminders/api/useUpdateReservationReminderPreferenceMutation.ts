import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { mapFirebaseError } from "@/services/firebase";
import type { MutationError } from "@/types";
import {
  updateBookingReminderPreference,
  type UpdateBookingReminderPreferencePayload,
} from "./updateReservationReminderPreference";

export const useUpdateBookingReminderPreferenceMutation = (): UseMutationResult<
  void,
  MutationError,
  UpdateBookingReminderPreferencePayload
> =>
  useMutation({
    mutationFn: async (payload) => {
      try {
        await updateBookingReminderPreference(payload);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
  });
