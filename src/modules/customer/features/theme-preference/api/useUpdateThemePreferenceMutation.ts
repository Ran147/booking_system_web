import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { mapFirebaseError } from "@/services/firebase";
import type { MutationError } from "@/types";
import {
  updateThemePreference,
  type UpdateThemePreferencePayload,
} from "./updateThemePreference";

export const useUpdateThemePreferenceMutation = (): UseMutationResult<
  void,
  MutationError,
  UpdateThemePreferencePayload
> =>
  useMutation({
    mutationFn: async (payload) => {
      try {
        await updateThemePreference(payload);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
  });
