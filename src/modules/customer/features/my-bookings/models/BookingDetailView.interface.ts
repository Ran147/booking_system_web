import type { BookingStatus } from "@/domain";
import type { Nullable } from "@/shared/types";
import type { MyBookingCancellation } from "./MyBooking.interface";

// A booking ready to render in its detail: every value already formatted in
// the business time zone and currency (AC-KAN-152-01).
export interface BookingDetailView {
  businessName: string;
  cancellation: Nullable<MyBookingCancellation>;
  collaboratorName: Nullable<string>;
  durationMinutes: number;
  endsAtLabel: string;
  priceLabel: string;
  serviceName: string;
  startsAtLabel: string;
  status: BookingStatus;
}
