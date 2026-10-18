import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { STRING } from "@/constants";
import type { Nullable } from "@/types";
import { mapPasswordResetError } from "./mapPasswordResetError";
import { passwordResetQueryKeys } from "./passwordResetQueryKeys";
import { verifyResetCode } from "./verifyResetCode";
import type { PasswordResetError } from "../models/PasswordReset.mutation";

// Checks the link once when the page opens. No retries: an expired code does
// not recover, and a network error has its own "try again" action.
export const useResetCodeQuery = (
  oobCode: Nullable<string>,
): UseQueryResult<string, PasswordResetError> =>
  useQuery<string, PasswordResetError>({
    enabled: oobCode !== null,
    queryFn: async () => {
      try {
        return await verifyResetCode(oobCode ?? STRING.EMPTY);
      } catch (error) {
        throw mapPasswordResetError(error);
      }
    },
    queryKey: passwordResetQueryKeys.code(oobCode),
    retry: false,
  });
