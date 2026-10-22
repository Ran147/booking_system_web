import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { businessLayoutQueryKeys } from "@/modules/business/layout/api";
import { businessProfileQueryKeys } from "./businessProfileQueryKeys";
import { saveBusinessPublicProfile } from "./saveBusinessPublicProfile";
import type { SaveBusinessPublicProfileInput } from "../models/BusinessProfileForm.model";

export const useSaveBusinessPublicProfileMutation = (
  businessId: string,
): UseMutationResult<void, Error, SaveBusinessPublicProfileInput> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveBusinessPublicProfile,
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({
        queryKey: businessProfileQueryKeys.detail(businessId),
      });
      await queryClient.invalidateQueries({
        queryKey: businessLayoutQueryKeys.profile(businessId),
      });
    },
  });
};
