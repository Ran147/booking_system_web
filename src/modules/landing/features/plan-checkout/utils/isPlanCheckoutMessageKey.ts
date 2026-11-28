import {
  PLAN_CHECKOUT_MESSAGE_KEY,
  type PlanCheckoutMessageKey,
} from "../constants/PlanCheckout.constants";

export const isPlanCheckoutMessageKey = (
  message: string,
): message is PlanCheckoutMessageKey =>
  Object.values(PLAN_CHECKOUT_MESSAGE_KEY).some(
    (messageKey) => messageKey === message,
  );
