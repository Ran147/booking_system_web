import type { ProfileFormViewModel } from "./ProfileFormViewModel.interface";

/** Props for the customer profile edit form. */
export interface ProfileFormProps {
  /** State and actions exposed by the profile form ViewModel. */
  readonly viewModel: ProfileFormViewModel;
}
