import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { mapFirebaseError } from "@/services/firebase";
import type { MutationError } from "@/types";
import type { UpdateLanguagePreferencePayload } from "../models";
import { updateLanguagePreference } from "./updateLanguagePreference";

export const useUpdateLanguagePreferenceMutation = (): UseMutationResult<
  void,
  MutationError,
  UpdateLanguagePreferencePayload
> =>
  useMutation({
    mutationFn: async (payload) => {
      try {
        await updateLanguagePreference(payload);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
  });
