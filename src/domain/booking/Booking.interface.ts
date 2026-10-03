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
  customerId: string;
  customerUserId: Nullable<string>;
  endsAt: Date;
  id: string;
  serviceId: string;
  serviceSnapshot: ServiceSnapshot;
  startsAt: Date;
  status: BookingStatus;
}
