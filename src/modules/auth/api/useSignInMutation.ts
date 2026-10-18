import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { mapSignInError } from "./mapSignInError";
import { signInWithPassword } from "./signInWithPassword";
import type {
  SignInError,
  SignInPayload,
  SignInResponse,
} from "../models/SignIn.mutation";

export const useSignInMutation = (): UseMutationResult<
  SignInResponse,
  SignInError,
  SignInPayload
> => {
  const { i18n } = useTranslation();

  return useMutation<SignInResponse, SignInError, SignInPayload>({
    mutationFn: async (signInPayload) => {
      try {
        return await signInWithPassword(signInPayload);
      } catch (error) {
        throw mapSignInError(error);
      }
    },
    // Hook-level, so it runs even when GuestOnly already left the sign-in
    // page, and before the ViewModel navigates (AC-KAN-129-02).
    onSuccess: async ({ language }) => {
      if (language) await i18n.changeLanguage(language);
    },
  });
};
