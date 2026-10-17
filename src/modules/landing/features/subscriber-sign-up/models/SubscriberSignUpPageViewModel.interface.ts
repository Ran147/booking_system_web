import type { ErrorMessageKey } from "@/shared/constants";
import type { Nullable } from "@/shared/types";
import type { SignUpLinkState } from "../constants/SubscriberSignUpForm.constants";

/**
 * The plan the visitor paid, as the page shows it (AC-KAN-25-14).
 */
export interface SignUpPlanSummary {
  readonly billingPeriodLabel: string;
  readonly formattedPrice: string;
  readonly planName: string;
}

/**
 * Resultado del ViewModel de la pagina de registro.
 */
export interface SubscriberSignUpPageViewModel {
  readonly checkoutEmail: string;
  /** Message of a link check that failed for a network or server reason. */
  readonly failedMessageKey: ErrorMessageKey;
  readonly handleSignUpComplete: (email: string) => void;
  readonly linkState: SignUpLinkState;
  readonly planSummary: Nullable<SignUpPlanSummary>;
  readonly retryLinkCheck: () => void;
  readonly signUpToken: string;
}
