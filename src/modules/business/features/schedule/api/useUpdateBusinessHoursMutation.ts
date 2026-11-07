import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/services/firebase";
import type { BusinessHours } from "../models";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export interface UpdateBusinessHoursInput {
  readonly businessHours: BusinessHours;
  readonly businessId: string;
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
      const businessReference = doc(firestore, "businesses", businessId);
      await updateDoc(businessReference, {
        businessHours,
      });
    },
    onSuccess: (_, { businessId }) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.hours(businessId),
      });
    },
  });
};
