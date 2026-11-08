import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type { BusinessHours } from "../models";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export interface UpdateBusinessHoursInput {
  readonly businessHours: BusinessHours;
  readonly businessId: string;
}

interface UpdateBusinessHoursResponse {
  readonly businessId: string;
  readonly success: boolean;
}

export const useUpdateBusinessHoursMutation = (): UseMutationResult<
  void,
  Error,
  UpdateBusinessHoursInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessHours,
      businessId,
    }: UpdateBusinessHoursInput): Promise<void> => {
      await callFunction<UpdateBusinessHoursInput, UpdateBusinessHoursResponse>(
        FUNCTION_NAME.UPDATE_BUSINESS_HOURS,
        {
          businessHours,
          businessId,
        },
      );
    },
    onSuccess: (_, { businessId }) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.hours(businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.all,
      });
    },
  });
};
