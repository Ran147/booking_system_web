import type { ProfileFormValues } from "./ProfileForm.schema";

export interface UpdateCustomerProfilePayload {
  formValues: ProfileFormValues;
  userId: string;
}

export interface UpdateCustomerProfileResponse {
  fullName: string;
  phone: string;
}
