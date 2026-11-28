import type { BaseSyntheticEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { Nullable } from "@/types";
import type { PlanCheckoutState } from "./PlanCheckout.model";
import type { PlanDetail } from "./PlanDetail.interface";
import type { ContractError } from "./PlanDetailViewModel.interface";

/**
 * Translated message of each checkout field, when it is invalid.
 */
export interface PlanCheckoutFieldErrors {
  readonly cardCvc?: string;
  readonly cardExpiry?: string;
  readonly cardNumber?: string;
  readonly cardholderName?: string;
  readonly email?: string;
  readonly termsAccepted?: string;
}

/**
 * React Hook Form registration of each checkout field.
 */
export interface PlanCheckoutFields {
  readonly cardCvc: UseFormRegisterReturn;
  readonly cardExpiry: UseFormRegisterReturn;
  readonly cardNumber: UseFormRegisterReturn;
  readonly cardholderName: UseFormRegisterReturn;
  readonly email: UseFormRegisterReturn;
  readonly termsAccepted: UseFormRegisterReturn;
}

/**
 * Props the checkout form needs for its reCAPTCHA (AC-KAN-22-06).
 * @property resetSignal - Changes after every server answer: a token is used once.
 */
export interface PlanCheckoutRecaptcha {
  readonly language: string;
  readonly onTokenChange: (recaptchaToken: Nullable<string>) => void;
  readonly resetSignal: number;
  readonly siteKey: string;
}

/**
 * What the checkout page ViewModel returns.
 * @property confirmedEmail - The email the server stored (AC-KAN-22-11).
 * @property formattedPrice - The price the next payment sends; after
 *   priceChanged it is the new one (AC-KAN-22-08).
 * @property isPayDisabled - No reCAPTCHA token yet (AC-KAN-22-06).
 * @property submitError - Why the last payment failed, shown above the form.
 */
export interface PlanCheckoutViewModel {
  readonly billingPeriodLabel: string;
  readonly checkoutState: PlanCheckoutState;
  readonly confirmedEmail: string;
  readonly fieldErrors: PlanCheckoutFieldErrors;
  readonly fields: PlanCheckoutFields;
  readonly formattedPrice: string;
  readonly handleBackToDetail: () => void;
  readonly handleSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly isPayDisabled: boolean;
  readonly isPlanLoading: boolean;
  readonly plan: Nullable<PlanDetail>;
  readonly recaptcha: PlanCheckoutRecaptcha;
  readonly submitError: Nullable<ContractError>;
}
