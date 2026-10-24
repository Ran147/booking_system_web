import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/services";
import {
  createAuthenticatedUserRequiredError,
  type ChangePasswordPayload,
} from "../models/ChangePassword.model";

/** Reauthenticates and updates the password of the current Firebase Auth user. */
export const changeCurrentUserPassword = async ({
  currentPassword,
  newPassword,
}: ChangePasswordPayload): Promise<void> => {
  const currentUser = auth.currentUser;

  if (!currentUser?.email) {
    throw createAuthenticatedUserRequiredError();
  }

  const credential = EmailAuthProvider.credential(
    currentUser.email,
    currentPassword,
  );
  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPassword);
};
