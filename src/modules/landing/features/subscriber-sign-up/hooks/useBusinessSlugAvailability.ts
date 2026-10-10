import type { Nullable } from "@/shared/types";
import { useDebouncedValue } from "./useDebouncedValue";
import { useBusinessSlugAvailabilityQuery } from "../api/useBusinessSlugAvailabilityQuery";
import { BUSINESS_SLUG_CHECK_DELAY_MS } from "../constants/SubscriberSignUpForm.constants";
import type { BusinessSlugAvailability } from "../constants/SubscriberSignUpServer.constants";
import { businessSlugSchema } from "../models/SubscriberSignUpForm.schema";

export interface BusinessSlugAvailabilityState {
  /** Null while unknown: invalid slug, check pending or check failed. */
  readonly availability: Nullable<BusinessSlugAvailability>;
  readonly isChecking: boolean;
}

// Asks the server whether the slug is free once the visitor stops typing
// (AC-KAN-25-15). Only a slug that passes the form rules is sent; the form
// shows its own error for the rest.
export const useBusinessSlugAvailability = (
  signUpToken: string,
  businessSlug: string,
): BusinessSlugAvailabilityState => {
  const debouncedBusinessSlug = useDebouncedValue(
    businessSlug,
    BUSINESS_SLUG_CHECK_DELAY_MS,
  );
  const isCheckable = businessSlugSchema.safeParse(
    debouncedBusinessSlug,
  ).success;
  const availabilityQuery = useBusinessSlugAvailabilityQuery(
    { businessSlug: debouncedBusinessSlug, signUpToken },
    isCheckable,
  );
  const isUpToDate = debouncedBusinessSlug === businessSlug && isCheckable;

  return {
    availability: isUpToDate
      ? (availabilityQuery.data?.availability ?? null)
      : null,
    isChecking:
      businessSlugSchema.safeParse(businessSlug).success &&
      (!isUpToDate || availabilityQuery.isFetching),
  };
};
