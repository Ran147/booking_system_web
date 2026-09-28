export const FIRESTORE_COLLECTION = {
  AUDIT_LOG: "auditLog",
  BOOKINGS: "bookings",
  BUSINESSES: "businesses",
  COLLABORATORS: "collaborators",
  CUSTOMERS: "customers",
  NOTIFICATIONS: "notifications",
  PAYMENTS: "payments",
  PLAN_CHECKOUTS: "planCheckouts",
  PLANS: "plans",
  PLATFORM_SETTINGS: "platformSettings",
  SCHEDULE_BLOCKS: "scheduleBlocks",
  SERVICES: "services",
  SUBSCRIPTION: "subscription",
  SUPPORT_TICKETS: "supportTickets",
  USERS: "users",
} as const;

export type FirestoreCollection =
  (typeof FIRESTORE_COLLECTION)[keyof typeof FIRESTORE_COLLECTION];
