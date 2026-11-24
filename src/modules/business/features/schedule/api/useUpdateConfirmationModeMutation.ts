import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type { BookingConfirmationMode } from "../constants";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export interface UpdateConfirmationModeInput {
  readonly businessId: string;
  readonly mode: BookingConfirmationMode;
}

interface UpdateConfirmationModeResponse {
  readonly businessId: string;
  readonly mode: string;
}

export const useUpdateConfirmationModeMutation = (): UseMutationResult<
  void,
  Error,
  UpdateConfirmationModeInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      mode,
    }: UpdateConfirmationModeInput): Promise<void> => {
      await callFunction<
        UpdateConfirmationModeInput,
        UpdateConfirmationModeResponse
      >(FUNCTION_NAME.UPDATE_CONFIRMATION_MODE, {
        businessId,
        mode,
      });
    },
    onSuccess: (_, { businessId }) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.hours(businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.confirmationMode(businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.all,
      });
    },
  });
};
