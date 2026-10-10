import type { BusinessSlugAvailability } from "../constants/SubscriberSignUp.constants.js";

export interface CheckBusinessSlugPayload {
  readonly businessSlug: string;
  readonly signUpToken: string;
}

export interface CheckBusinessSlugResponse {
  readonly availability: BusinessSlugAvailability;
}
