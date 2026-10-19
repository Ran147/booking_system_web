import type { Timestamp } from "firebase-admin/firestore";
import type { NullableRef } from "../../shared/types/Nullable.js";

/** planCheckouts/{planCheckoutId}, as written by the KAN-22 checkout (plan-checkout SPEC "Data"). */
export interface PlanCheckoutDocument {
  readonly amountInCents: number;
  readonly email: string;
  readonly language?: string;
  readonly paidAt: Timestamp;
  readonly paymentReference?: string;
  readonly planId: string;
  readonly signUpCompletedAt: NullableRef<Timestamp>;
  /** null until the KAN-24 email creates the sign-up link (KAN-22 spec D1). */
  readonly signUpLinkExpiresAt: NullableRef<Timestamp>;
  /** null until the KAN-24 email creates the sign-up link (KAN-22 spec D1). */
  readonly signUpTokenHash: NullableRef<string>;
  readonly termsAcceptedAt?: Timestamp;
  readonly termsVersion?: string;
}
