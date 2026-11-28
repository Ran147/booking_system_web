import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import { mapPlanCheckoutFunctionError } from "./mapPlanCheckoutFunctionError";
import type {
  PayPlanCheckoutPayload,
  PayPlanCheckoutResponse,
} from "../models/PayPlanCheckout.mutation";
import type { PlanCheckoutFunctionError } from "../models/PlanCheckoutFunctionError.interface";

// Pays the plan through the simulated gateway on the server (AC-KAN-22-02).
// A visitor has nothing cached that depends on the payment, so nothing is
// invalidated.
export const usePayPlanCheckoutMutation = (): UseMutationResult<
  PayPlanCheckoutResponse,
  PlanCheckoutFunctionError,
  PayPlanCheckoutPayload
> =>
  useMutation<
    PayPlanCheckoutResponse,
    PlanCheckoutFunctionError,
    PayPlanCheckoutPayload
  >({
    mutationFn: async (payPlanCheckoutPayload) => {
      try {
        return await callFunction<
          PayPlanCheckoutPayload,
          PayPlanCheckoutResponse
        >(FUNCTION_NAME.PAY_PLAN_CHECKOUT, payPlanCheckoutPayload);
      } catch (error) {
        throw mapPlanCheckoutFunctionError(error);
      }
    },
  });
