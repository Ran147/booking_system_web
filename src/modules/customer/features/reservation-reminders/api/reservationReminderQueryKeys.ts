import { FIRESTORE_COLLECTION } from "@/constants";

export const bookingReminderQueryKeys = Object.freeze({
  detail: (userId: string): readonly [string, string, string] =>
    Object.freeze([
      FIRESTORE_COLLECTION.USERS,
      userId,
      "bookingRemindersEnabled",
    ] as const),
});
