import type { Nullable } from "@/types";

export interface CustomerProfile {
  email: Nullable<string>;
  fullName: Nullable<string>;
  phone: Nullable<string>;
}
