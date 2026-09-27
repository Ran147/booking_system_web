// Custom claims set only by Cloud Functions (auth-and-roles §1).
export const AUTH_CLAIM = {
  BUSINESS_ID: "businessId",
  ROLE: "role",
} as const;
