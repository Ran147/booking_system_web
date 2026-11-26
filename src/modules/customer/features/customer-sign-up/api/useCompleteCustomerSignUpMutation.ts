import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type { MutationError } from "@/types";
import { mapCustomerSignUpError } from "./mapCustomerSignUpError";
import type {
  CompleteCustomerSignUpPayload,
  CompleteCustomerSignUpResponse,
} from "../models/CompleteCustomerSignUp.mutation";

// Creates the customer account on the server (KAN-123). Nothing is cached for
// a visitor, so nothing is invalidated.
export const useCompleteCustomerSignUpMutation = (): UseMutationResult<
  CompleteCustomerSignUpResponse,
  MutationError,
  CompleteCustomerSignUpPayload
> =>
  useMutation<
    CompleteCustomerSignUpResponse,
    MutationError,
    CompleteCustomerSignUpPayload
  >({
    mutationFn: async (completeCustomerSignUpPayload) => {
      try {
        return await callFunction<
          CompleteCustomerSignUpPayload,
          CompleteCustomerSignUpResponse
        >(
          FUNCTION_NAME.COMPLETE_CUSTOMER_SIGN_UP,
          completeCustomerSignUpPayload,
        );
      } catch (error) {
        throw mapCustomerSignUpError(error);
      }
    },
  });
