import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { ERROR_MESSAGE_KEY } from "@/constants";
import { mapFirebaseError } from "@/services";
import type { MutationError } from "@/types";
import { isChangePasswordError, type ChangePasswordPayload } from "../models";
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
        if (isChangePasswordError(error)) {
          throw {
            code: error.code,
            messageKey: ERROR_MESSAGE_KEY.UNKNOWN,
          } satisfies MutationError;
        }

        throw mapFirebaseError(error);
      }
    },
  });
