import type { ProfileFormValues } from "./ProfileForm.schema";

/** Input required to update the signed-in customer's editable profile fields. */
export interface UpdateCustomerProfilePayload {
  readonly formValues: ProfileFormValues;
  readonly userId: string;
}

/** Normalized editable profile fields returned after a successful update. */
export interface UpdateCustomerProfileResponse {
  readonly fullName: string;
  readonly phone: string;
}
