import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { isReservedBusinessSlug } from "../../shared/isReservedBusinessSlug.js";
import type { CallableHandlerInput } from "../../shared/models/CallableHandler.model.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import {
  BUSINESS_SLUG_AVAILABILITY,
  SIGN_UP_ERROR,
} from "../constants/SubscriberSignUp.constants.js";
import { findSignUpCheckout } from "../findSignUpCheckout.js";
import type { CheckBusinessSlugResponse } from "../models/CheckBusinessSlug.mutation.js";
import { checkBusinessSlugPayloadSchema } from "../models/SubscriberSignUp.schema.js";

// Availability shown while the visitor types the slug (AC-KAN-25-15). Only a
// valid sign-up link may ask, so the check cannot be used to list slugs. It is
// a hint: the sign-up checks again inside its transaction (AC-KAN-25-18).
// Shared by the callable and the Vercel dispatcher (Q8).
export const handleCheckBusinessSlug = async ({
  firestore,
  now,
  payload,
}: CallableHandlerInput): Promise<CheckBusinessSlugResponse> => {
  const { businessSlug, signUpToken } = parseCallablePayload(
    checkBusinessSlugPayloadSchema,
    payload,
    SIGN_UP_ERROR.INVALID_PAYLOAD,
  );
  await findSignUpCheckout({ firestore, now, signUpToken });

  if (isReservedBusinessSlug(businessSlug)) {
    return { availability: BUSINESS_SLUG_AVAILABILITY.RESERVED };
  }
  const slugLockSnapshot = await firestore
    .collection(FIRESTORE_COLLECTION.BUSINESS_SLUGS)
    .doc(businessSlug)
    .get();

  return {
    availability: slugLockSnapshot.exists
      ? BUSINESS_SLUG_AVAILABILITY.TAKEN
      : BUSINESS_SLUG_AVAILABILITY.AVAILABLE,
  };
};
