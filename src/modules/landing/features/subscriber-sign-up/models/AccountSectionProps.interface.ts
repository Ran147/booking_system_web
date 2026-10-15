import type { SubscriberSignUpSectionProps } from "./SubscriberSignUpFormViewModel.interface";

export interface AccountSectionProps extends SubscriberSignUpSectionProps {
  /** Current password, read by the strength meter (AC-KAN-25-02). */
  readonly password: string;
}
