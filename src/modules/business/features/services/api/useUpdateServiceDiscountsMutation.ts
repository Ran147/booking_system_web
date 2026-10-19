import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { mapFirebaseError } from "@/services/firebase";
import type { MutationError } from "@/types";
import { serviceQueryKeys } from "./serviceQueryKeys";
import { updateServiceDiscounts } from "./updateServiceDiscounts";
import type {
  UpdateServiceDiscountsPayload,
  UpdateServiceDiscountsResponse,
} from "../models/UpdateServiceDiscounts.mutation";

export const useUpdateServiceDiscountsMutation = (): UseMutationResult<
  UpdateServiceDiscountsResponse,
  MutationError,
  UpdateServiceDiscountsPayload
> => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateServiceDiscountsResponse,
    MutationError,
    UpdateServiceDiscountsPayload
  >({
    mutationFn: async (payload) => {
      try {
        return await updateServiceDiscounts(payload);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
    onSuccess: async (_response, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serviceQueryKeys.all(payload.businessId),
        }),
        queryClient.invalidateQueries({
          queryKey: serviceQueryKeys.detail(
            payload.businessId,
            payload.serviceId,
          ),
        }),
      ]);
    },
  });
};
