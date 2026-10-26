import { z } from "zod";
import { CHECKOUT_FIELD_LIMIT } from "../constants/PlanCheckout.constants";

export const checkoutSchema = z.object({
  cardCvc: z
    .string()
    .min(CHECKOUT_FIELD_LIMIT.CARD_CVC_MIN_LENGTH)
    .max(CHECKOUT_FIELD_LIMIT.CARD_CVC_MAX_LENGTH),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "MM/AA"),
  cardNumber: z
    .string()
    .transform((value) => value.replace(/\s+/g, ""))
    .refine((value) => /^\d{16}$/.test(value), "16 dígitos"),
  cardholderName: z
    .string()
    .min(CHECKOUT_FIELD_LIMIT.CARDHOLDER_NAME_MIN_LENGTH),
  email: z.string().email(),
  recaptchaToken: z.string().optional(),
  termsAccepted: z.boolean().refine((value) => value === true, {
    message: "termsRequired",
  }),
});

export type PlanCheckoutFormValues = z.infer<typeof checkoutSchema>;

export const PLAN_CHECKOUT_STATE = Object.freeze({
  DECLINED: "declined",
  ERROR: "error",
  LOADING: "loading",
  NOT_FOUND: "notFound",
  PROCESSING: "processing",
  READY: "ready",
  SUCCESS: "success",
});

export type PlanCheckoutState =
  (typeof PLAN_CHECKOUT_STATE)[keyof typeof PLAN_CHECKOUT_STATE];
