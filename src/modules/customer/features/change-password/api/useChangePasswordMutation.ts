import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { ChangePasswordError, ChangePasswordPayload } from "../models";
import { changeCurrentUserPassword } from "./changeCurrentUserPassword";
import { mapChangePasswordError } from "./mapChangePasswordError";

export const useChangePasswordMutation = (): UseMutationResult<
  void,
  ChangePasswordError,
  ChangePasswordPayload
> =>
  useMutation({
    mutationFn: async (payload) => {
      try {
        await changeCurrentUserPassword(payload);
      } catch (error) {
        throw mapChangePasswordError(error);
      }
    },
  });
