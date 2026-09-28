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

export interface Booking {
  businessId: string;
  cancellation: Nullable<BookingCancellation>;
  // The collaborator who serves the booking (Q1). Null only when the service
  // has no collaborator assigned, so the business serves it as one resource.
  // Automatic assignment (KAN-138) is always resolved to one collaborator.
  collaboratorId: Nullable<string>;
  customerId: string;
  customerUserId: Nullable<string>;
  endsAt: Date;
  id: string;
  serviceId: string;
  serviceSnapshot: ServiceSnapshot;
  startsAt: Date;
  status: BookingStatus;
}
