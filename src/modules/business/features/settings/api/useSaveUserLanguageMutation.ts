import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { mapFirebaseError } from "@/services";
import type { MutationError } from "@/types";
import type { SaveUserLanguageInput } from "../models";
import { saveUserLanguage } from "./saveUserLanguage";
import { userLanguageQueryKeys } from "./userLanguageQueryKeys";

export const useSaveUserLanguageMutation = (): UseMutationResult<
  void,
  MutationError,
  SaveUserLanguageInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input) => {
      try {
        await saveUserLanguage(input);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
    onSuccess: (_response, input) => {
      queryClient.setQueryData(userLanguageQueryKeys.detail(input.userId), {
        language: input.language,
      });
    },
  });
};
