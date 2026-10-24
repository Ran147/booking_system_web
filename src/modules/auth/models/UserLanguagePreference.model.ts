import type { Language } from "@/constants";
import type { Nullable } from "@/types";

/** Language preference read from the authenticated user's profile. */
export interface UserLanguagePreference {
  /** Saved language, or null when the user has never chosen one. */
  readonly language: Nullable<Language>;
}

/** Input used to save the authenticated user's language. */
export interface SaveUserLanguageInput {
  /** Whether the write must also maintain the profile update timestamp. */
  readonly includeUpdatedAt?: boolean;
  /** New supported interface language. */
  readonly language: Language;
  /** Authenticated user's Firebase UID. */
  readonly userId: string;
}

/** Locally persisted language change that has not reached Firestore yet. */
export type PendingLanguageSync = SaveUserLanguageInput;
