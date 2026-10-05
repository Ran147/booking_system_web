import { FirebaseError } from "firebase/app";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { auth } from "@/services/firebase";
import type { ChangePasswordPayload } from "../models";

export const changeCurrentUserPassword = async ({
  currentPassword,
  newPassword,
}: ChangePasswordPayload): Promise<void> => {
  const currentUser = auth.currentUser;

  if (!currentUser?.email) {
    throw new FirebaseError(
      FIREBASE_ERROR_CODE.REQUIRES_RECENT_LOGIN,
      FIREBASE_ERROR_CODE.REQUIRES_RECENT_LOGIN,
    );
  }

  const credential = EmailAuthProvider.credential(
    currentUser.email,
    currentPassword,
  );
  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPassword);
};
