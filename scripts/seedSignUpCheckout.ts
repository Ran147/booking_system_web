// Sign-up seed data (KAN-25), called from seed-emulator.ts: one paid checkout
// with a valid link, one with an expired link, and the businessSlugs locks of
// the seeded businesses, so /sign-up can be tried end to end locally.
import { createHash } from "node:crypto";
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import {
  SEED_DOCUMENT_ID,
  SEED_BUSINESS,
  SEED_PENDING_BUSINESS,
  SEED_PLAN,
  SEED_SUBSCRIPTION_PERIOD,
} from "./constants/SeedEmulator.constants";
import {
  SEED_EXPIRED_LINK_PAID_DAYS_AGO,
  SEED_SIGN_UP_CHECKOUT,
  SEED_SIGN_UP_LINK,
  SEED_SIGN_UP_URL_BASE,
} from "./constants/SeedSignUpCheckout.constants";
import { FIRESTORE_COLLECTION } from "../src/constants/firestore/FirestoreCollection.constants";

interface SeedSignUpCheckout {
  EMAIL: string;
  ID: string;
  SIGN_UP_TOKEN: string;
}

const hashSignUpToken = (signUpToken: string): string =>
  createHash(SEED_SIGN_UP_LINK.HASH_ALGORITHM)
    .update(signUpToken)
    .digest(SEED_SIGN_UP_LINK.HASH_ENCODING);

const readMsDaysAgo = (days: number): number =>
  Date.now() - days * SEED_SUBSCRIPTION_PERIOD.MS_PER_DAY;

// Only the hash is stored, as the real checkout does (plan-checkout SPEC
// "Data"). Running the seed again resets the link to unused.
const writeSignUpCheckout = async (
  firestore: Firestore,
  seedCheckout: SeedSignUpCheckout,
  paidDaysAgo: number,
): Promise<void> => {
  const paidAtMs = readMsDaysAgo(paidDaysAgo);

  await firestore
    .collection(FIRESTORE_COLLECTION.PLAN_CHECKOUTS)
    .doc(seedCheckout.ID)
    .set({
      amountInCents: SEED_PLAN.BASIC.PRICE_IN_CENTS,
      email: seedCheckout.EMAIL,
      paidAt: Timestamp.fromMillis(paidAtMs),
      planId: SEED_DOCUMENT_ID.PLAN_BASIC,
      signUpCompletedAt: null,
      signUpLinkExpiresAt: Timestamp.fromMillis(
        paidAtMs +
          SEED_SIGN_UP_LINK.VALID_DAYS * SEED_SUBSCRIPTION_PERIOD.MS_PER_DAY,
      ),
      signUpTokenHash: hashSignUpToken(seedCheckout.SIGN_UP_TOKEN),
    });
};

// Every business holds its slug lock (subscriber-sign-up SPEC "Data"), so
// checkBusinessSlug reports the seeded slugs as taken.
const writeBusinessSlugLocks = async (firestore: Firestore): Promise<void> => {
  const businessSlugsCollection = firestore.collection(
    FIRESTORE_COLLECTION.BUSINESS_SLUGS,
  );
  const createdAt = Timestamp.now();

  await businessSlugsCollection
    .doc(SEED_BUSINESS.SLUG)
    .set({ businessId: SEED_DOCUMENT_ID.BUSINESS, createdAt });
  await businessSlugsCollection
    .doc(SEED_PENDING_BUSINESS.SLUG)
    .set({ businessId: SEED_DOCUMENT_ID.PENDING_BUSINESS, createdAt });
};

export const seedSignUpCheckouts = async (
  firestore: Firestore,
): Promise<void> => {
  await writeBusinessSlugLocks(firestore);
  await writeSignUpCheckout(firestore, SEED_SIGN_UP_CHECKOUT.VALID, 0);
  await writeSignUpCheckout(
    firestore,
    SEED_SIGN_UP_CHECKOUT.EXPIRED,
    SEED_EXPIRED_LINK_PAID_DAYS_AGO,
  );

  console.log("\nSign-up links (KAN-25):");
  console.log(
    `Valid (${SEED_SIGN_UP_CHECKOUT.VALID.EMAIL}): ${SEED_SIGN_UP_URL_BASE}${SEED_SIGN_UP_CHECKOUT.VALID.SIGN_UP_TOKEN}`,
  );
  console.log(
    `Expired (${SEED_SIGN_UP_CHECKOUT.EXPIRED.EMAIL}): ${SEED_SIGN_UP_URL_BASE}${SEED_SIGN_UP_CHECKOUT.EXPIRED.SIGN_UP_TOKEN}`,
  );
};
