import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { FIRESTORE_COLLECTION } from "@/constants";
import { createCustomerBooking } from "./createCustomerBooking";
import type {
  CreateCustomerBookingPayload,
  CreateCustomerBookingResponse,
} from "../models/bookingCheckout.model";

const AVAILABILITY_KEY_ROOT = "availability";

/**
 * Confirms the booking. Afterwards the customer's bookings and the free slots
 * are stale: both are invalidated so My bookings and availability refetch.
 */
export const useCreateBookingMutation = (): UseMutationResult<
  CreateCustomerBookingResponse,
  unknown,
  CreateCustomerBookingPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomerBooking,
    onSuccess: async (): Promise<void> => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [FIRESTORE_COLLECTION.BOOKINGS],
        }),
        queryClient.invalidateQueries({ queryKey: [AVAILABILITY_KEY_ROOT] }),
      ]);
    },
  });
};
