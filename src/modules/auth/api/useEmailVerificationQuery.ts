import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { STRING } from "@/constants";
import type { Nullable } from "@/types";
import { applyEmailVerificationCode } from "./applyEmailVerificationCode";
import { emailVerificationQueryKeys } from "./emailVerificationQueryKeys";
import { mapEmailVerificationError } from "./mapEmailVerificationError";
import type { EmailVerificationError } from "../models/emailVerification.model";

// A query, not a mutation, on purpose: the code is applied once when the page
// opens and the cache keeps that one result. Its key dedupes the double
// effect of StrictMode, and staleTime Infinity stops focus or reconnect from
// applying an already used code again (that would answer "invalid link").
// No retries: a used code does not recover; the network error has its own
// "try again" action (refetch).
export const useEmailVerificationQuery = (
  oobCode: Nullable<string>,
): UseQueryResult<true, EmailVerificationError> =>
  useQuery<true, EmailVerificationError>({
    enabled: oobCode !== null,
    queryFn: async () => {
      try {
        await applyEmailVerificationCode(oobCode ?? STRING.EMPTY);
        return true as const;
      } catch (error) {
        throw mapEmailVerificationError(error);
      }
    },
    queryKey: emailVerificationQueryKeys.code(oobCode),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  });
