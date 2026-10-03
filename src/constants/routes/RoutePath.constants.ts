// The customer portal lives under the business slug, /<businessSlug>/... (Q4).
// Static top-level paths win over that dynamic segment; each of their segments
// is listed in RESERVED_BUSINESS_SLUG (src/shared/domain).
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
    ROOT: "/:businessSlug",
  },
  LANDING: {
    CONTACT: "/contact",
    HOME: "/",
    SIGN_UP: "/sign-up",
  },
  NOT_FOUND: "*",
} as const;
