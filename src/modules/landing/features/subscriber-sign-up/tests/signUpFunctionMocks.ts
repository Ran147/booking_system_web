import {
  FunctionsError,
  type FunctionsErrorCodeCore,
} from "firebase/functions";
import { FUNCTION_NAME, type FunctionName } from "@/shared/constants";
import { callFunction } from "@/shared/lib/firebase";
import type { SignUpErrorReason } from "../constants/SubscriberSignUpServer.constants";
import type { CheckBusinessSlugResponse } from "../models/CheckBusinessSlug.mutation";
import type { CompleteSubscriberSignUpResponse } from "../models/CompleteSubscriberSignUp.mutation";
import type { ValidateSignUpLinkResponse } from "../models/ValidateSignUpLink.mutation";

// The tests replace callFunction with vi.mock("@/services/firebase/callFunction").
export const SIGN_UP_TEST_TOKEN = "test-sign-up-token";
export const SIGN_UP_TEST_EMAIL = "duena@negocio.com";

export const VALID_SIGN_UP_LINK: ValidateSignUpLinkResponse = {
  amountInCents: 29_900,
  billingPeriod: "monthly",
  checkoutEmail: SIGN_UP_TEST_EMAIL,
  planName: "Básico",
};

export const buildSignUpFunctionError = (
  code: FunctionsErrorCodeCore,
  reason?: SignUpErrorReason,
): FunctionsError =>
  new FunctionsError(code, "test error", reason ? { reason } : undefined);

type SignUpFunctionHandler = (payload: unknown) => Promise<unknown>;

export interface SignUpFunctionHandlers {
  readonly checkBusinessSlug?: () => Promise<CheckBusinessSlugResponse>;
  readonly completeSubscriberSignUp?: () => Promise<CompleteSubscriberSignUpResponse>;
  readonly validateSignUpLink?: () => Promise<ValidateSignUpLinkResponse>;
}

// Each function answers like a working server unless the test overrides it.
export const mockSignUpFunctions = (
  signUpFunctionHandlers: SignUpFunctionHandlers = {},
): void => {
  const handlerByName: Partial<Record<FunctionName, SignUpFunctionHandler>> = {
    [FUNCTION_NAME.CHECK_BUSINESS_SLUG]:
      signUpFunctionHandlers.checkBusinessSlug ??
      (async (): Promise<CheckBusinessSlugResponse> => ({
        availability: "available",
      })),
    [FUNCTION_NAME.COMPLETE_SUBSCRIBER_SIGN_UP]:
      signUpFunctionHandlers.completeSubscriberSignUp ??
      (async (): Promise<CompleteSubscriberSignUpResponse> => ({
        email: SIGN_UP_TEST_EMAIL,
      })),
    [FUNCTION_NAME.VALIDATE_SIGN_UP_LINK]:
      signUpFunctionHandlers.validateSignUpLink ??
      (async (): Promise<ValidateSignUpLinkResponse> => VALID_SIGN_UP_LINK),
  };
  vi.mocked(callFunction).mockImplementation(async (functionName, payload) => {
    const handler = handlerByName[functionName];
    if (!handler) throw new Error(`Unexpected function ${functionName}`);
    return handler(payload);
  });
};

export const readCallPayload = (functionName: FunctionName): unknown[] =>
  vi
    .mocked(callFunction)
    .mock.calls.filter(
      ([calledFunctionName]) => calledFunctionName === functionName,
    )
    .map(([, payload]) => payload);
