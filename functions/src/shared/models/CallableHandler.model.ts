import type { Firestore } from "firebase-admin/firestore";
import type { Nullable } from "../types/Nullable.js";

/** Who calls, read from the verified ID token; `null` for a visitor. */
export interface CallableCaller {
  readonly role: unknown;
  readonly uid: string;
}

/**
 * What a shared handler receives (Q8): the onCall wrapper and the Vercel
 * dispatcher build it from their own request and Admin SDK instance.
 */
export interface CallableHandlerInput {
  readonly caller: Nullable<CallableCaller>;
  readonly payload: unknown;
  readonly firestore: Firestore;
  readonly now: Date;
}
