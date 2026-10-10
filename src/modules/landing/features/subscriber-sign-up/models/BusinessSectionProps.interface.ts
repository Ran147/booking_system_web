import type { SubscriberSignUpSectionProps } from "./SubscriberSignUpFormViewModel.interface";

export interface BusinessSectionProps extends SubscriberSignUpSectionProps {
  /** Address of the customer pages, "/<slug>" (AC-KAN-25-15). */
  readonly businessAddress: string;
}
