import { verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/services/firebase";

// Resolves with the email of the account when the code is still valid.
export const verifyResetCode = (oobCode: string): Promise<string> =>
  verifyPasswordResetCode(auth, oobCode);
