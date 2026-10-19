import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";

export interface UpdateBookingReminderPreferencePayload {
  isEnabled: boolean;
  userId: string;
}

export const updateBookingReminderPreference = async ({
  isEnabled,
  userId,
}: UpdateBookingReminderPreferencePayload): Promise<void> => {
  await updateDoc(doc(firestore, FIRESTORE_COLLECTION.USERS, userId), {
    bookingRemindersEnabled: isEnabled,
    updatedAt: serverTimestamp(),
  });
};
