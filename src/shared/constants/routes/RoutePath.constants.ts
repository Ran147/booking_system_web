// The customer portal's public business pages wait for Q4 (how a business
// page is reached). CUSTOMER.ROOT is a provisional prefix for the portal shell
// until that decision is recorded.
export const ROUTE_PATH = {
  ADMIN: {
    AUDIT_LOG: "audit-log",
    BUSINESSES: "businesses",
    DASHBOARD: "dashboard",
    PLANS: "plans",
    ROOT: "/admin",
    SUPPORT_TICKETS: "support-tickets",
  },
  AUTH: {
    PASSWORD_RECOVERY: "/password-recovery",
    SIGN_IN: "/sign-in",
  },
  BUSINESS: {
    CUSTOMERS: "customers",
    REPORTS: "reports",
    ROOT: "/business",
    SCHEDULE: "schedule",
    SERVICE_NEW: "services/new",
    SERVICES: "services",
    SETTINGS: "settings",
    SUBSCRIPTION: "subscription",
  },
  CUSTOMER: {
    ROOT: "/customer",
  },
  LANDING: {
    CONTACT: "/contact",
    HOME: "/",
    SIGN_UP: "/sign-up",
  },
  NOT_FOUND: "*",
} as const;
