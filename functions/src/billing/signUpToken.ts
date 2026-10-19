import { createHash, randomBytes } from "node:crypto";
import { SIGN_UP_LINK } from "./constants/SubscriberSignUp.constants.js";

export interface SignUpTokenPair {
  readonly signUpToken: string;
  readonly signUpTokenHash: string;
}

// Only the hash is stored on the PlanCheckout, so the database never holds a
// usable link (plan-checkout SPEC "Data").
export const hashSignUpToken = (signUpToken: string): string =>
  createHash(SIGN_UP_LINK.HASH_ALGORITHM)
    .update(signUpToken)
    .digest(SIGN_UP_LINK.HASH_ENCODING);

// Used by the KAN-24 email function and by the emulator seed.
export const createSignUpToken = (): SignUpTokenPair => {
  const signUpToken = randomBytes(SIGN_UP_LINK.TOKEN_BYTE_LENGTH).toString(
    SIGN_UP_LINK.TOKEN_ENCODING,
  );
  return { signUpToken, signUpTokenHash: hashSignUpToken(signUpToken) };
};
