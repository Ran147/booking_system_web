import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { MutationError } from "@/types";
import { serviceQueryKeys } from "./serviceQueryKeys";
import { updateServiceCollaborators } from "./updateServiceCollaborators";
import type {
  UpdateServiceCollaboratorsPayload,
  UpdateServiceCollaboratorsResponse,
} from "../models/UpdateServiceCollaborators.mutation";

export const useUpdateServiceCollaboratorsMutation = (): UseMutationResult<
  UpdateServiceCollaboratorsResponse,
  MutationError,
  UpdateServiceCollaboratorsPayload
> => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateServiceCollaboratorsResponse,
    MutationError,
    UpdateServiceCollaboratorsPayload
  >({
    mutationFn: (payload) => updateServiceCollaborators(payload),
    onSuccess: async (_response, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: serviceQueryKeys.all(payload.businessId),
        }),
        queryClient.invalidateQueries({
          queryKey: serviceQueryKeys.collaborators(
            payload.businessId,
            payload.serviceId,
          ),
        }),
      ]);
    },
  });
};
