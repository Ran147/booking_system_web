import type { UseFormRegisterReturn } from "react-hook-form";

/**
 * Props of the terms acceptance on the checkout (KAN-23).
 * @property field - React Hook Form registration of termsAccepted.
 * @property hasOpenedTerms - The visitor opened the terms at least once; until
 *   then the checkbox is disabled (AS-11).
 * @property isTermsAccepted - The checkbox is checked (AC-KAN-23-03).
 * @property onTermsOpened - Called when the terms link is activated.
 */
export interface PlanCheckoutTermsFieldProps {
  readonly field: UseFormRegisterReturn;
  readonly hasOpenedTerms: boolean;
  readonly isTermsAccepted: boolean;
  readonly onTermsOpened: () => void;
}
