import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type { Nullable } from "@/types";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export interface CreateBookingInput {
  readonly businessId: string;
  readonly collaboratorId?: Nullable<string>;
  readonly customerId: string;
  readonly notes?: Nullable<string>;
  readonly serviceId: string;
  readonly startsAt: string;
}

interface CreateBookingResponse {
  readonly bookingId: string;
  readonly status: string;
}

export const useCreateBookingMutation = (): UseMutationResult<
  CreateBookingResponse,
  Error,
  CreateBookingInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      return await callFunction<CreateBookingInput, CreateBookingResponse>(
        FUNCTION_NAME.CREATE_BOOKING,
        input,
      );
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.blocks(variables.businessId),
      });
    },
  });
};
