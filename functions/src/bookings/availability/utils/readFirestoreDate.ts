// Bookings and blocks store instants as Firestore Timestamps; older documents
// and tests may hold a Date or an ISO string. An unreadable value becomes an
// invalid Date, which never overlaps any slot. A Timestamp is recognized by its
// toDate method, not with instanceof: the Vercel dispatcher and the functions
// package can load different copies of firebase-admin (Q8).
export const readFirestoreDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(typeof value === "string" ? value : Number.NaN);
};
