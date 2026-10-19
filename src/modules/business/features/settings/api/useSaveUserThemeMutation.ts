import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { mapFirebaseError } from "@/services";
import type { MutationError } from "@/types";
import type { SaveUserThemeInput } from "../models";
import { saveUserTheme } from "./saveUserTheme";
import { userThemeQueryKeys } from "./userThemeQueryKeys";

export const useSaveUserThemeMutation = (): UseMutationResult<
  void,
  MutationError,
  SaveUserThemeInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input) => {
      try {
        await saveUserTheme(input);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
    onSuccess: (_response, input) => {
      queryClient.setQueryData(userThemeQueryKeys.detail(input.userId), {
        theme: input.theme,
      });
    },
  });
};
