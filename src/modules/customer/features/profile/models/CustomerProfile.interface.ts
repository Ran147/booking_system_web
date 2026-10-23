import type { Nullable } from "@/types";

/** Personal account information displayed on the customer profile page. */
export interface CustomerProfile {
  readonly email: Nullable<string>;
  readonly fullName: Nullable<string>;
  readonly phone: Nullable<string>;
}
