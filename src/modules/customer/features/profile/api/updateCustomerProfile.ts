import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import type {
  UpdateCustomerProfilePayload,
  UpdateCustomerProfileResponse,
} from "../models";

export const updateCustomerProfile = async ({
  formValues,
  userId,
}: UpdateCustomerProfilePayload): Promise<UpdateCustomerProfileResponse> => {
  const updatedProfile = {
    fullName: formValues.fullName.trim(),
    phone: formValues.phone.trim(),
  };

  await updateDoc(doc(firestore, FIRESTORE_COLLECTION.USERS, userId), {
    ...updatedProfile,
    updatedAt: serverTimestamp(),
  });

  return updatedProfile;
};
