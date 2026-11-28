import { useSearchParams } from "react-router";
import { ROUTE_PATH, SEARCH_PARAM } from "@/constants";
import type { Nullable } from "@/types";
import { useEmailVerificationQuery } from "../api/useEmailVerificationQuery";
import {
  AUTH_ACTION_MODE,
  EMAIL_VERIFICATION_ERROR_KEY,
  EMAIL_VERIFICATION_STATE,
  type EmailVerificationErrorKey,
  type EmailVerificationState,
} from "../constants/AuthAction.constants";
import type { EmailVerificationViewModel } from "../models/emailVerification.model";
import { buildSignInPath } from "../utils/buildSignInPath";
import { readContinuePath } from "../utils/readContinuePath";

const resolveVerificationState = (
  oobCode: Nullable<string>,
  verificationQuery: ReturnType<typeof useEmailVerificationQuery>,
): EmailVerificationState => {
  if (!oobCode) return EMAIL_VERIFICATION_STATE.INVALID;
  // A retry keeps isError until it answers: show the check again meanwhile.
  if (verificationQuery.isFetching) return EMAIL_VERIFICATION_STATE.CHECKING;
  if (verificationQuery.isError) {
    return verificationQuery.error.messageKey ===
      EMAIL_VERIFICATION_ERROR_KEY.LINK_INVALID
      ? EMAIL_VERIFICATION_STATE.INVALID
      : EMAIL_VERIFICATION_STATE.FAILED;
  }
  return verificationQuery.isSuccess
    ? EMAIL_VERIFICATION_STATE.VERIFIED
    : EMAIL_VERIFICATION_STATE.CHECKING;
};

/**
 * Aplica el código del enlace de verificación y decide a qué inicio de sesión
 * lleva el botón (KAN-126, AC-KAN-126-02 y AC-KAN-126-03).
 * @returns {EmailVerificationViewModel}
 */
export const useEmailVerificationViewModel = (): EmailVerificationViewModel => {
  const [searchParameters] = useSearchParams();
  // Only a verification link is applied; any other mode is an invalid link.
  const isVerificationLink =
    searchParameters.get(SEARCH_PARAM.MODE) === AUTH_ACTION_MODE.VERIFY_EMAIL;
  const oobCode = isVerificationLink
    ? searchParameters.get(SEARCH_PARAM.OOB_CODE) || null
    : null;
  const verificationQuery = useEmailVerificationQuery(oobCode);
  const continuePath = readContinuePath(
    searchParameters.get(SEARCH_PARAM.CONTINUE_URL),
  );
  const verificationState = resolveVerificationState(
    oobCode,
    verificationQuery,
  );
  const errorKey: Nullable<EmailVerificationErrorKey> =
    verificationState === EMAIL_VERIFICATION_STATE.FAILED
      ? (verificationQuery.error?.messageKey ??
        EMAIL_VERIFICATION_ERROR_KEY.UNKNOWN)
      : null;

  return {
    errorKey,
    retryVerification: (): void => {
      void verificationQuery.refetch();
    },
    signInPath: continuePath
      ? buildSignInPath(continuePath)
      : ROUTE_PATH.AUTH.SIGN_IN,
    verificationState,
  };
};
