import type { WhereFilterOp } from "firebase/firestore";

export const FIRESTORE_OPERATOR = {
  EQUAL: "==",
  GREATER_OR_EQUAL: ">=",
  LESS_OR_EQUAL: "<=",
} as const satisfies Record<string, WhereFilterOp>;

export const FIRESTORE_QUERY = {
  PREFIX_UPPER_BOUND: "",
} as const;
