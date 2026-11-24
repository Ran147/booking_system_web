import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export interface CancelBookingInput {
  readonly bookingId: string;
  readonly businessId: string;
  readonly cancelledBy: "business";
  readonly isPenalized: boolean;
  readonly note: string;
}

interface CancelBookingResponse {
  readonly bookingId: string;
  readonly status: string;
}

export const useCancelBookingMutation = (): UseMutationResult<
  CancelBookingResponse,
  Error,
  CancelBookingInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CancelBookingInput) => {
      return await callFunction<CancelBookingInput, CancelBookingResponse>(
        FUNCTION_NAME.CANCEL_BOOKING,
        input,
      );
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
