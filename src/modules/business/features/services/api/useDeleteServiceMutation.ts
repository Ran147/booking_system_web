import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import { mapDeleteServiceError } from "./mapDeleteServiceError";
import { serviceQueryKeys } from "./serviceQueryKeys";
import type {
  DeleteServicePayload,
  DeleteServiceResponse,
} from "../models/DeleteService.mutation";
import type { DeleteServiceError } from "../models/DeleteServiceError.interface";

export const useDeleteServiceMutation = (): UseMutationResult<
  DeleteServiceResponse,
  DeleteServiceError,
  DeleteServicePayload
> => {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteServiceResponse,
    DeleteServiceError,
    DeleteServicePayload
  >({
    mutationFn: async (payload) => {
      try {
        return await callFunction<DeleteServicePayload, DeleteServiceResponse>(
          FUNCTION_NAME.DELETE_SERVICE,
          payload,
        );
      } catch (error) {
        throw mapDeleteServiceError(error);
      }
    },
    onSuccess: async (_response, payload) => {
      await queryClient.invalidateQueries({
        queryKey: serviceQueryKeys.all(payload.businessId),
      });
    },
  });
};
