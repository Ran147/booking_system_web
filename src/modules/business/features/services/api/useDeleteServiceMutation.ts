import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/constants";
import { callFunction, mapFirebaseError } from "@/services/firebase";
import type { MutationError } from "@/types";
import { serviceQueryKeys } from "./serviceQueryKeys";
import type {
  DeleteServicePayload,
  DeleteServiceResponse,
} from "../models/DeleteService.mutation";

export const useDeleteServiceMutation = (): UseMutationResult<
  DeleteServiceResponse,
  MutationError,
  DeleteServicePayload
> => {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteServiceResponse,
    MutationError,
    DeleteServicePayload
  >({
    mutationFn: async (payload) => {
      try {
        return await callFunction<DeleteServicePayload, DeleteServiceResponse>(
          FUNCTION_NAME.DELETE_SERVICE,
          payload,
        );
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
