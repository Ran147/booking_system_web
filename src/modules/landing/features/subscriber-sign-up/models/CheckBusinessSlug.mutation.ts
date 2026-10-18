import type { BusinessSlugAvailability } from "../constants/SubscriberSignUpServer.constants";

// Contract of the checkBusinessSlug function (SPEC "Server functions").
export interface CheckBusinessSlugPayload {
  readonly businessSlug: string;
  readonly signUpToken: string;
}

export interface CheckBusinessSlugResponse {
  readonly availability: BusinessSlugAvailability;
}
