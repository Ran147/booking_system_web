import { readFirebaseEnvironment } from "./readFirebaseEnvironment";

// Kept apart from firebaseApp so reading the key never initializes Firebase.
export const recaptchaSiteKey = readFirebaseEnvironment(
  import.meta.env,
).recaptchaSiteKey;
