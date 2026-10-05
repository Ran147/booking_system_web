import type { SubscriberSignUpSectionProps } from "./SubscriberSignUpFormViewModel.interface";

export interface BusinessSectionProps extends SubscriberSignUpSectionProps {
  /** Address of the customer pages, "/<slug>" (AC-KAN-25-15). */
  readonly businessAddress: string;
}

export interface AccountSectionProps extends SubscriberSignUpSectionProps {
  /** Current password, read by the strength meter (AC-KAN-25-02). */
  readonly password: string;
}
