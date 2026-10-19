import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { mapFirebaseError } from "@/services/firebase";
import type { CursorPage, MutationError, NullableUndefined } from "@/types";
import { serviceQueryKeys } from "./serviceQueryKeys";
import { updateServiceStatus } from "./updateServiceStatus";
import type { ServiceListItem } from "../models/ServiceListItem.interface";
import type {
  UpdateServiceStatusPayload,
  UpdateServiceStatusResponse,
} from "../models/UpdateServiceStatus.mutation";

interface UpdateServiceStatusContext {
  readonly previousQueries: readonly [
    readonly unknown[],
    NullableUndefined<CursorPage<ServiceListItem>>,
  ][];
}

export const useUpdateServiceStatusMutation = (): UseMutationResult<
  UpdateServiceStatusResponse,
  MutationError,
  UpdateServiceStatusPayload,
  UpdateServiceStatusContext
> => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateServiceStatusResponse,
    MutationError,
    UpdateServiceStatusPayload,
    UpdateServiceStatusContext
  >({
    mutationFn: async (payload) => {
      try {
        return await updateServiceStatus(payload);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
    onError: (_error, _payload, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, queryData] of context.previousQueries) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: serviceQueryKeys.all(payload.businessId),
      });

      const previousQueries = queryClient.getQueriesData<
        CursorPage<ServiceListItem>
      >({
        queryKey: serviceQueryKeys.all(payload.businessId),
      });

      queryClient.setQueriesData<CursorPage<ServiceListItem>>(
        { queryKey: serviceQueryKeys.all(payload.businessId) },
        (oldData) => {
          if (!oldData) {
            return oldData;
          }
          return {
            ...oldData,
            items: oldData.items.map((item) =>
              item.id === payload.serviceId
                ? { ...item, status: payload.status }
                : item,
            ),
          };
        },
      );

      return { previousQueries };
    },
    onSettled: async (_data, _error, payload) => {
      if (payload) {
        await queryClient.invalidateQueries({
          queryKey: serviceQueryKeys.all(payload.businessId),
        });
      }
    },
  });
};
