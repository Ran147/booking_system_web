import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/shared/constants";
import { callFunction } from "@/shared/lib/firebase";
import { mapSignUpFunctionError } from "./mapSignUpFunctionError";
import { signUpQueryKeys } from "./signUpQueryKeys";
import type {
  CheckBusinessSlugPayload,
  CheckBusinessSlugResponse,
} from "../models/CheckBusinessSlug.mutation";
import type { SignUpFunctionError } from "../models/SignUpFunctionError.interface";

// Availability hint while the visitor types the slug (AC-KAN-25-15). The
// sign-up checks the slug again, so a failed hint never blocks the form.
export const useBusinessSlugAvailabilityQuery = (
  checkBusinessSlugPayload: CheckBusinessSlugPayload,
  isEnabled: boolean,
): UseQueryResult<CheckBusinessSlugResponse, SignUpFunctionError> =>
  useQuery<CheckBusinessSlugResponse, SignUpFunctionError>({
    enabled: isEnabled,
    queryFn: async () => {
      try {
        return await callFunction<
          CheckBusinessSlugPayload,
          CheckBusinessSlugResponse
        >(FUNCTION_NAME.CHECK_BUSINESS_SLUG, checkBusinessSlugPayload);
      } catch (error) {
        throw mapSignUpFunctionError(error);
      }
    },
    queryKey: signUpQueryKeys.businessSlug(
      checkBusinessSlugPayload.signUpToken,
      checkBusinessSlugPayload.businessSlug,
    ),
    refetchOnWindowFocus: false,
    retry: false,
  });
