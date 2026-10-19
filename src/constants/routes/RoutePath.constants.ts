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
    PASSWORD_RESET: "/password-reset",
    SIGN_IN: "/sign-in",
  },
  BUSINESS: {
    BUSINESS_PROFILE: "business-profile",
    CUSTOMERS: "customers",
    REPORTS: "reports",
    ROOT: "/business",
    SCHEDULE: "schedule",
    SERVICE_COLLABORATORS: "services/:serviceId/collaborators",
    SERVICE_DISCOUNTS: "services/:serviceId/discounts",
    SERVICE_EDIT: "services/:serviceId/edit",
    SERVICE_NEW: "services/new",
    SERVICES: "services",
    SETTINGS: "settings",
    SUBSCRIPTION: "subscription",
  },
  CUSTOMER: {
    BOOKING_DETAIL: "my-bookings/:bookingId",
    MY_BOOKINGS: "my-bookings",
    ROOT: "/:businessSlug",
  },
  LANDING: {
    ABOUT: "/about",
    CONTACT: "/contact",
    HOME: "/",
    PLAN_CHECKOUT: "/plans/:planId/checkout",
    PLAN_DETAIL: "/plans/:planId",
    PLANS: "/plans",
    SIGN_UP: "/sign-up",
    TERMS: "/terms",
  },
  NOT_FOUND: "*",
} as const;
