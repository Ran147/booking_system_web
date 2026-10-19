import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type {
  RequestPasswordResetPayload,
  RequestPasswordResetResponse,
} from "../models/PasswordReset.mutation";

// US-36, D-1b: one callable checks the reCAPTCHA and asks Firebase for the
// reset email in the account's language. It answers the same whether or not
// the account exists. Errors are raw here; the mutation hook maps them.
export const requestPasswordReset = (
  payload: RequestPasswordResetPayload,
): Promise<RequestPasswordResetResponse> =>
  callFunction<RequestPasswordResetPayload, RequestPasswordResetResponse>(
    FUNCTION_NAME.REQUEST_PASSWORD_RESET,
    payload,
  );
