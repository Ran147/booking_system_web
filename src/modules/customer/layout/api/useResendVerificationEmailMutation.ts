import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { mapResendVerificationError } from "./mapResendVerificationError";
import { sendVerificationEmailAgain } from "./sendVerificationEmailAgain";
import type { ResendVerificationMessageKey } from "../constants/EmailVerificationBanner.constants";
import type { ResendVerificationEmailVariables } from "../models";

// Sends the verification email again (AC-KAN-126-04 … 06). Nothing cached
// depends on it, so nothing is invalidated.
export const useResendVerificationEmailMutation = (): UseMutationResult<
  void,
  ResendVerificationMessageKey,
  ResendVerificationEmailVariables
> =>
  useMutation<
    void,
    ResendVerificationMessageKey,
    ResendVerificationEmailVariables
  >({
    mutationFn: async ({ continueUrl, language }) => {
      try {
        await sendVerificationEmailAgain(continueUrl, language);
      } catch (error) {
        throw mapResendVerificationError(error);
      }
    },
  });
