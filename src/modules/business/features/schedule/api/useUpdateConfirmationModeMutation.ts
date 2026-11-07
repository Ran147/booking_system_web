import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/services/firebase";
import type { BookingConfirmationMode } from "../constants";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export interface UpdateConfirmationModeInput {
  readonly businessId: string;
  readonly mode: BookingConfirmationMode;
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
      const businessReference = doc(firestore, "businesses", businessId);
      await updateDoc(businessReference, {
        bookingConfirmationMode: mode,
      });
    },
    onSuccess: (_, { businessId }) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.hours(businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.confirmationMode(businessId),
      });
    },
  });
};
