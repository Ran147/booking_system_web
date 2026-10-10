import type { Timestamp } from "firebase-admin/firestore";
import type { NullableRef } from "../../shared/types/Nullable.js";

/** planCheckouts/{planCheckoutId}, as written by the KAN-22 checkout (plan-checkout SPEC "Data"). */
export interface PlanCheckoutDocument {
  readonly amountInCents: number;
  readonly email: string;
  readonly paidAt: Timestamp;
  readonly paymentReference?: string;
  readonly planId: string;
  readonly signUpCompletedAt: NullableRef<Timestamp>;
  readonly signUpLinkExpiresAt: Timestamp;
  readonly signUpTokenHash: string;
}
