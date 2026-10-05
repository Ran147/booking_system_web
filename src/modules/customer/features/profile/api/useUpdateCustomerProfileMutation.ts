import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { mapFirebaseError } from "@/services/firebase";
import type { MutationError } from "@/types";
import type {
  CustomerProfile,
  UpdateCustomerProfilePayload,
  UpdateCustomerProfileResponse,
} from "../models";
import { customerProfileQueryKeys } from "./customerProfileQueryKeys";
import { updateCustomerProfile } from "./updateCustomerProfile";

export const useUpdateCustomerProfileMutation = (): UseMutationResult<
  UpdateCustomerProfileResponse,
  MutationError,
  UpdateCustomerProfilePayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      try {
        return await updateCustomerProfile(payload);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
    onSuccess: (response, payload) => {
      queryClient.setQueryData<CustomerProfile>(
        customerProfileQueryKeys.detail(payload.userId),
        (currentProfile) =>
          currentProfile ? { ...currentProfile, ...response } : currentProfile,
      );
    },
  });
};
