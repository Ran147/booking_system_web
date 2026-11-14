import { Timestamp } from "firebase-admin/firestore";

// Bookings and blocks store instants as Firestore Timestamps; older documents
// and tests may hold a Date or an ISO string. An unreadable value becomes an
// invalid Date, which never overlaps any slot.
export const readFirestoreDate = (value: unknown): Date => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return new Date(typeof value === "string" ? value : Number.NaN);
};
