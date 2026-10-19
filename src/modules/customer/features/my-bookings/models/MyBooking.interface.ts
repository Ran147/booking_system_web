import type { BookingStatus, CancellationActor } from "@/domain";
import type { Nullable } from "@/shared/types";

// What the customer may see of a cancellation: never the business note (AS-4).
export interface MyBookingCancellation {
  cancelledBy: CancellationActor;
  isPenalized: boolean;
}

export interface MyBooking {
  businessId: string;
  cancellation: Nullable<MyBookingCancellation>;
  collaboratorName: Nullable<string>;
  durationMinutes: number;
  endsAt: Date;
  id: string;
  priceInCents: number;
  serviceName: string;
  startsAt: Date;
  status: BookingStatus;
}
