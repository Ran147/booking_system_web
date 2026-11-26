import { applyActionCode } from "firebase/auth";
import { auth } from "@/services/firebase";

// Marks the email of the account as verified. If that account is the one
// signed in on this browser, it is reloaded so emailVerified is fresh. The
// reload is best effort: once the code is applied the email IS verified, and
// failing here would offer a retry that applies a used code ("invalid link").
export const applyEmailVerificationCode = async (
  oobCode: string,
): Promise<void> => {
  await applyActionCode(auth, oobCode);
  await auth.currentUser?.reload().catch(() => undefined);
};
