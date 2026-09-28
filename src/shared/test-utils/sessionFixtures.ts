import { SESSION_STATUS, type Session } from "@/features/auth";
import { USER_ROLE } from "@/shared/domain";

export const SUBSCRIBER_SESSION = {
  businessId: "business-test",
  collaboratorId: null,
  role: USER_ROLE.SUBSCRIBER,
  status: SESSION_STATUS.SIGNED_IN,
  userId: "subscriber-test",
} as const satisfies Session;

export const COLLABORATOR_SESSION = {
  businessId: "business-test",
  collaboratorId: "collaborator-test",
  role: USER_ROLE.COLLABORATOR,
  status: SESSION_STATUS.SIGNED_IN,
  userId: "collaborator-user-test",
} as const satisfies Session;

export const CUSTOMER_SESSION = {
  businessId: null,
  collaboratorId: null,
  role: USER_ROLE.CUSTOMER,
  status: SESSION_STATUS.SIGNED_IN,
  userId: "customer-test",
} as const satisfies Session;

export const SUPER_ADMIN_SESSION = {
  businessId: null,
  collaboratorId: null,
  role: USER_ROLE.SUPER_ADMIN,
  status: SESSION_STATUS.SIGNED_IN,
  userId: "super-admin-test",
} as const satisfies Session;

export const SIGNED_OUT_SESSION = {
  status: SESSION_STATUS.SIGNED_OUT,
} as const satisfies Session;
