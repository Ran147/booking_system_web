import type { BookingStatus } from "@/domain";
import type { NullableRef } from "@/shared/types";

// Filters of both lists, kept in the URL (AC-KAN-154-04). Dates are
// YYYY-MM-DD, read in the business time zone (AC-KAN-154-02).
export interface MyBookingsFilters {
  businessId: NullableRef<string>;
  from: NullableRef<string>;
  status: NullableRef<BookingStatus>;
  to: NullableRef<string>;
}
