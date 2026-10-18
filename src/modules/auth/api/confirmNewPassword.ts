import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/services/firebase";
import type { ConfirmNewPasswordPayload } from "../models/PasswordReset.mutation";

export const confirmNewPassword = ({
  newPassword,
  oobCode,
}: ConfirmNewPasswordPayload): Promise<void> =>
  confirmPasswordReset(auth, oobCode, newPassword);
