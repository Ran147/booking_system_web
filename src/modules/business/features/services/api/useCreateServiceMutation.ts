import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { mapFirebaseError } from "@/services/firebase";
import type { MutationError } from "@/types";
import { createService } from "./createService";
import { serviceQueryKeys } from "./serviceQueryKeys";
import type {
  CreateServicePayload,
  CreateServiceResponse,
} from "../models/CreateService.mutation";

export const useCreateServiceMutation = (): UseMutationResult<
  CreateServiceResponse,
  MutationError,
  CreateServicePayload
> => {
  const queryClient = useQueryClient();

  return useMutation<
    CreateServiceResponse,
    MutationError,
    CreateServicePayload
  >({
    mutationFn: async (payload) => {
      try {
        return await createService(payload);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
    onSuccess: async (_response, payload) => {
      await queryClient.invalidateQueries({
        queryKey: serviceQueryKeys.all(payload.businessId),
      });
    },
  });
};
