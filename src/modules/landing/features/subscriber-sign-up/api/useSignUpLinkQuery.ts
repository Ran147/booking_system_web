import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/shared/constants";
import { callFunction } from "@/shared/lib/firebase";
import { mapSignUpFunctionError } from "./mapSignUpFunctionError";
import { signUpQueryKeys } from "./signUpQueryKeys";
import type { SignUpFunctionError } from "../models/SignUpFunctionError.interface";
import type {
  ValidateSignUpLinkPayload,
  ValidateSignUpLinkResponse,
} from "../models/ValidateSignUpLink.mutation";

// Checks the sign-up link once when the page opens (AC-KAN-25-14,
// AC-KAN-25-20). A rejected link does not become valid on a retry.
export const useSignUpLinkQuery = (
  signUpToken: string,
): UseQueryResult<ValidateSignUpLinkResponse, SignUpFunctionError> =>
  useQuery<ValidateSignUpLinkResponse, SignUpFunctionError>({
    enabled: signUpToken.length > 0,
    queryFn: async () => {
      try {
        return await callFunction<
          ValidateSignUpLinkPayload,
          ValidateSignUpLinkResponse
        >(FUNCTION_NAME.VALIDATE_SIGN_UP_LINK, { signUpToken });
      } catch (error) {
        throw mapSignUpFunctionError(error);
      }
    },
    queryKey: signUpQueryKeys.link(signUpToken),
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  });
