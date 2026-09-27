import type { FirebaseOptions } from "firebase/app";
import type { Nullable } from "@/shared/types";

export interface FirebaseEnvironment {
  firebaseOptions: FirebaseOptions;
  recaptchaEnterpriseSiteKey: Nullable<string>;
  shouldUseEmulators: boolean;
}
