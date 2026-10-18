import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// The Admin SDK is initialized once and shared by every function
// (cloud-functions-standards §1). Inside the Emulator Suite it connects to the
// emulators through the *_EMULATOR_HOST variables the CLI sets.
const firebaseApp = initializeApp();

export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
