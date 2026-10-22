import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/shared/constants";
import { callFunction } from "@/shared/lib/firebase";
import { mapSignUpFunctionError } from "./mapSignUpFunctionError";
import type {
  CompleteSubscriberSignUpPayload,
  CompleteSubscriberSignUpResponse,
} from "../models/CompleteSubscriberSignUp.mutation";
import type { SignUpFunctionError } from "../models/SignUpFunctionError.interface";

// Creates the account and the pending business in one call (AC-KAN-25-16).
// Nothing is cached yet for a new subscriber, so nothing is invalidated.
export const useCompleteSubscriberSignUpMutation = (): UseMutationResult<
  CompleteSubscriberSignUpResponse,
  SignUpFunctionError,
  CompleteSubscriberSignUpPayload
> =>
  useMutation<
    CompleteSubscriberSignUpResponse,
    SignUpFunctionError,
    CompleteSubscriberSignUpPayload
  >({
    mutationFn: async (completeSubscriberSignUpPayload) => {
      try {
        return await callFunction<
          CompleteSubscriberSignUpPayload,
          CompleteSubscriberSignUpResponse
        >(
          FUNCTION_NAME.COMPLETE_SUBSCRIBER_SIGN_UP,
          completeSubscriberSignUpPayload,
        );
      } catch (error) {
        throw mapSignUpFunctionError(error);
      }
    },
  });
