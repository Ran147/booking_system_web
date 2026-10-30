import type { SubscriberSignUpSectionProps } from "./SubscriberSignUpFormViewModel.interface";

export interface AccountSectionProps extends SubscriberSignUpSectionProps {
  readonly handleUnlockEmail?: () => void;
  readonly isEmailReadOnly?: boolean;
  /** Current password, read by the strength meter (AC-KAN-25-02). */
  readonly password: string;
}
