import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { mapFirebaseError } from "@/services/firebase";
import type { MutationError } from "@/types";
import { fetchBookingReminderPreference } from "./fetchReservationReminderPreference";
import { bookingReminderQueryKeys } from "./reservationReminderQueryKeys";

export const useBookingReminderPreferenceQuery = (
  userId: string,
): UseQueryResult<boolean, MutationError> =>
  useQuery({
    enabled: userId.length > 0,
    queryFn: async () => {
      try {
        return await fetchBookingReminderPreference(userId);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
    queryKey: bookingReminderQueryKeys.detail(userId),
  });
