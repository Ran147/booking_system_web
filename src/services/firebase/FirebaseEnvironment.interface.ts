import type { FirebaseOptions } from "firebase/app";
import type { Nullable } from "@/shared/types";

export interface FirebaseEnvironment {
  firebaseOptions: FirebaseOptions;
  recaptchaEnterpriseSiteKey: Nullable<string>;
  // reCAPTCHA v2 checkbox shown on public forms (RecaptchaField).
  recaptchaSiteKey: string;
  shouldUseEmulators: boolean;
}
