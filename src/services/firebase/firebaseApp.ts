import { initializeApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { FIREBASE_EMULATOR } from "@/shared/constants";
import { readFirebaseEnvironment } from "./readFirebaseEnvironment";

const firebaseEnvironment = readFirebaseEnvironment(import.meta.env);

export const firebaseApp = initializeApp(firebaseEnvironment.firebaseOptions);

// App Check protects Firestore and Functions in real projects
// (auth-and-roles §5). The emulators do not enforce it.
if (
  !firebaseEnvironment.shouldUseEmulators &&
  firebaseEnvironment.recaptchaEnterpriseSiteKey
) {
  initializeAppCheck(firebaseApp, {
    isTokenAutoRefreshEnabled: true,
    provider: new ReCaptchaEnterpriseProvider(
      firebaseEnvironment.recaptchaEnterpriseSiteKey,
    ),
  });
}

export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp);

if (firebaseEnvironment.shouldUseEmulators) {
  connectAuthEmulator(auth, FIREBASE_EMULATOR.AUTH_URL, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(
    firestore,
    FIREBASE_EMULATOR.HOST,
    FIREBASE_EMULATOR.PORT.FIRESTORE,
  );
  connectFunctionsEmulator(
    functions,
    FIREBASE_EMULATOR.HOST,
    FIREBASE_EMULATOR.PORT.FUNCTIONS,
  );
}
