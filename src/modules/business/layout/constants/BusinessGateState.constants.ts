// What the business portal shows (US-33, D-1): the portal for active,
// inactive and suspended businesses, a status screen for pending and rejected
// ones (AC-KAN-33-09, AC-KAN-33-11), and a retry when the business cannot be
// read (AC-KAN-33-12).
export const BUSINESS_GATE_STATE = Object.freeze({
  CHECKING: "checking",
  ERROR: "error",
  PENDING: "pending",
  PORTAL: "portal",
  REJECTED: "rejected",
} as const);

export type BusinessGateState =
  (typeof BUSINESS_GATE_STATE)[keyof typeof BUSINESS_GATE_STATE];

export const BUSINESS_GATE_ERROR = Object.freeze({
  BUSINESS_NOT_FOUND: "business-not-found",
} as const);

export const BUSINESS_GATE_QUERY_SCOPE = "gate";

export const MAILTO_PROTOCOL = "mailto:";
