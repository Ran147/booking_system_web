import type { OrderByDirection, WhereFilterOp } from "firebase/firestore";

export const FIRESTORE_OPERATOR = {
  EQUAL: "==",
  GREATER_OR_EQUAL: ">=",
  GREATER_THAN: ">",
  IN: "in",
  LESS_OR_EQUAL: "<=",
} as const satisfies Record<string, WhereFilterOp>;

export const FIRESTORE_ORDER = {
  ASCENDING: "asc",
  DESCENDING: "desc",
} as const satisfies Record<string, OrderByDirection>;

export const FIRESTORE_QUERY = {
  // U+F8FF, the highest character of the index: written as an escape so no
  // editor drops it as an invisible character.
  PREFIX_UPPER_BOUND: "",
} as const;
