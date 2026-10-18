import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { confirmNewPassword } from "./confirmNewPassword";
import { mapPasswordResetError } from "./mapPasswordResetError";
import type {
  ConfirmNewPasswordPayload,
  PasswordResetError,
} from "../models/PasswordReset.mutation";

export const useConfirmNewPasswordMutation = (): UseMutationResult<
  void,
  PasswordResetError,
  ConfirmNewPasswordPayload
> =>
  useMutation<void, PasswordResetError, ConfirmNewPasswordPayload>({
    mutationFn: async (payload) => {
      try {
        await confirmNewPassword(payload);
      } catch (error) {
        throw mapPasswordResetError(error);
      }
    },
  });
