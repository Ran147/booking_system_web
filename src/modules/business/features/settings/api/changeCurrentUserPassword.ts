import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/services";
import {
  createAuthenticatedUserRequiredError,
  type ChangePasswordPayload,
} from "../models";

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
