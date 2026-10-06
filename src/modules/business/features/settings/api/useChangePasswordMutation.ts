import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { mapFirebaseError } from "@/services";
import type { MutationError } from "@/types";
import type { ChangePasswordPayload } from "../models";
import { changeCurrentUserPassword } from "./changeCurrentUserPassword";

export const useChangePasswordMutation = (): UseMutationResult<
  void,
  MutationError,
  ChangePasswordPayload
> =>
  useMutation({
    mutationFn: async (payload) => {
      try {
        await changeCurrentUserPassword(payload);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
  });
