export const USER_ROLE = {
  CUSTOMER: "customer",
  SUBSCRIBER: "subscriber",
  SUPER_ADMIN: "super_admin",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
