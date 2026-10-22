import type { SubscriberSignUpSectionProps } from "./SubscriberSignUpFormViewModel.interface";

export interface BusinessSectionProps extends SubscriberSignUpSectionProps {
  /** Address of the customer pages, "/<slug>", and whether it is free (AC-KAN-25-15). */
  readonly businessSlugHelperText: string;
}
