// collaborator: an employee of one business who serves its customers (Q1,
// 2026-09-28). Uses the business portal, limited by the permissions the
// subscriber grants (KAN-86, CollaboratorPermission.constants.ts).
export const USER_ROLE = {
  COLLABORATOR: "collaborator",
  CUSTOMER: "customer",
  SUBSCRIBER: "subscriber",
  SUPER_ADMIN: "super_admin",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
