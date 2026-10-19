import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { mapFirebaseError } from "@/services/firebase";
import type { MutationError } from "@/types";
import { serviceQueryKeys } from "./serviceQueryKeys";
import { updateService } from "./updateService";
import type {
  UpdateServicePayload,
  UpdateServiceResponse,
} from "../models/UpdateService.mutation";

export const useUpdateServiceMutation = (): UseMutationResult<
  UpdateServiceResponse,
  MutationError,
  UpdateServicePayload
> => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateServiceResponse,
    MutationError,
    UpdateServicePayload
  >({
    mutationFn: async (payload) => {
      try {
        return await updateService(payload);
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
