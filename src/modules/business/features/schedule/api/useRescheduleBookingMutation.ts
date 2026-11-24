import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export interface RescheduleBookingInput {
  readonly bookingId: string;
  readonly businessId: string;
  readonly newStartsAt: string;
}

interface RescheduleBookingResponse {
  readonly bookingId: string;
  readonly endsAt: string;
  readonly startsAt: string;
}

export const useRescheduleBookingMutation = (): UseMutationResult<
  RescheduleBookingResponse,
  Error,
  RescheduleBookingInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RescheduleBookingInput) => {
      return await callFunction<
        RescheduleBookingInput,
        RescheduleBookingResponse
      >(FUNCTION_NAME.RESCHEDULE_BOOKING, input);
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
