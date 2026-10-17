import type { Nullable } from "@/shared/types";
import type {
  BookingStatus,
  CancellationActor,
} from "./BookingStatus.constants";

export interface ServiceSnapshot {
  durationMinutes: number;
  name: string;
  priceInCents: number;
}

export interface BookingCancellation {
  cancelledBy: CancellationActor;
  isPenalized: boolean;
  note: Nullable<string>;
}

// One earlier slot of a rescheduled booking (KAN-155); startsAt / endsAt on
// Booking always hold the current one.
export interface BookingReschedule {
  changedAt: Date;
  previousEndsAt: Date;
  previousStartsAt: Date;
}

export interface Booking {
  businessId: string;
  cancellation: Nullable<BookingCancellation>;
  // Who serves the booking (Q1); null when the service has no collaborator.
  collaboratorId: Nullable<string>;
  // Full name copied when the booking is made, like serviceSnapshot, so the
  // customer reads it without access to collaborators (KAN-150, D-1).
  collaboratorName: Nullable<string>;
  customerId: string;
  customerUserId: Nullable<string>;
  endsAt: Date;
  id: string;
  rescheduleHistory: BookingReschedule[];
  serviceId: string;
  serviceSnapshot: ServiceSnapshot;
  startsAt: Date;
  status: BookingStatus;
}
