import type { Language } from "@/constants";
import type { Nullable } from "@/types";
import type { SignedInSession } from "./Session.types";
import type { SignInErrorKey } from "../constants/SignInErrorKey.constants";

export interface SignInPayload {
  readonly email: string;
  readonly password: string;
  readonly recaptchaToken: string;
}

export interface SignInResponse {
  // User.language; null when the profile has none or cannot be read.
  readonly language: Nullable<Language>;
  // Role and claims read from the fresh ID token.
  readonly session: SignedInSession;
}

export interface SignInError {
  readonly code: string;
  readonly messageKey: SignInErrorKey;
}

// Contract of the verifyRecaptcha callable (functions/src/auth).
export interface VerifyRecaptchaPayload {
  readonly recaptchaToken: string;
}

export interface VerifyRecaptchaResponse {
  readonly isVerified: true;
}
