import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { mapPasswordResetError } from "./mapPasswordResetError";
import { requestPasswordReset } from "./requestPasswordReset";
import type {
  PasswordResetError,
  RequestPasswordResetPayload,
  RequestPasswordResetResponse,
} from "../models/PasswordReset.mutation";

export const useRequestPasswordResetMutation = (): UseMutationResult<
  RequestPasswordResetResponse,
  PasswordResetError,
  RequestPasswordResetPayload
> =>
  useMutation<
    RequestPasswordResetResponse,
    PasswordResetError,
    RequestPasswordResetPayload
  >({
    mutationFn: async (payload) => {
      try {
        return await requestPasswordReset(payload);
      } catch (error) {
        throw mapPasswordResetError(error);
      }
    },
  });
