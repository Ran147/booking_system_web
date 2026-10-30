// Custom claims set only by Cloud Functions (auth-and-roles §1).
// collaboratorId is set only for the collaborator role (Q1).
export const AUTH_CLAIM = {
  BUSINESS_ID: "businessId",
  BUSINESS_ID_SNAKE: "business_id",
  COLLABORATOR_ID: "collaboratorId",
  ROLE: "role",
} as const;
