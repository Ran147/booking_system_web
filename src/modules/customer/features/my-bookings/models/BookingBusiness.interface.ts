import type { Nullable } from "@/shared/types";

export interface BookingBusiness {
  // Businesses created by the real sign-up have no currency yet.
  currency: Nullable<string>;
  id: string;
  name: string;
  slug: string;
  timeZone: string;
}
