// Custom claims set only by Cloud Functions (auth-and-roles §1).
// collaboratorId is set only for the collaborator role (Q1).
export const AUTH_CLAIM = {
  BUSINESS_ID: "businessId",
  COLLABORATOR_ID: "collaboratorId",
  ROLE: "role",
} as const;
