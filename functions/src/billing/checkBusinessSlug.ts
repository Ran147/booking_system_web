import { onCall } from "firebase-functions/v2/https";
import {
  BUSINESS_SLUG_AVAILABILITY,
  SIGN_UP_ERROR,
} from "./constants/SubscriberSignUp.constants.js";
import { findSignUpCheckout } from "./findSignUpCheckout.js";
import type {
  CheckBusinessSlugPayload,
  CheckBusinessSlugResponse,
} from "./models/CheckBusinessSlug.mutation.js";
import { checkBusinessSlugPayloadSchema } from "./models/SubscriberSignUp.schema.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { isReservedBusinessSlug } from "../shared/isReservedBusinessSlug.js";
import { readPayload } from "../shared/readPayload.js";

// Availability shown while the visitor types the slug (AC-KAN-25-15). Only a
// valid sign-up link may ask, so the check cannot be used to list slugs. It is
// a hint: completeSubscriberSignUp checks again inside its transaction
// (AC-KAN-25-18).
export const checkBusinessSlug = onCall<
  CheckBusinessSlugPayload,
  Promise<CheckBusinessSlugResponse>
>(async (request) => {
  const { businessSlug, signUpToken } = readPayload(
    checkBusinessSlugPayloadSchema,
    request.data,
    SIGN_UP_ERROR.INVALID_PAYLOAD,
  );
  await findSignUpCheckout(signUpToken);

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
});
