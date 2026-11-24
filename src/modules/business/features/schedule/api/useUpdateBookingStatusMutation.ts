import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export interface UpdateBookingStatusInput {
  readonly bookingId: string;
  readonly businessId: string;
  readonly targetStatus: "confirmed" | "completed" | "no_show";
}

interface UpdateBookingStatusResponse {
  readonly bookingId: string;
  readonly status: string;
}

export const useUpdateBookingStatusMutation = (): UseMutationResult<
  UpdateBookingStatusResponse,
  Error,
  UpdateBookingStatusInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateBookingStatusInput) => {
      return await callFunction<
        UpdateBookingStatusInput,
        UpdateBookingStatusResponse
      >(FUNCTION_NAME.UPDATE_BOOKING_STATUS, input);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.detail(
          variables.businessId,
          variables.bookingId,
        ),
      });
    },
  });
};
