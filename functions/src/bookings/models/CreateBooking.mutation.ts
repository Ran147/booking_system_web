import type { Nullable } from "../../shared/types/Nullable.js";

export interface ServiceSnapshot {
  readonly durationMinutes: number;
  readonly name: string;
  readonly priceInCents: number;
}

export interface CreateBookingPayload {
  readonly businessId: string;
  readonly collaboratorId?: Nullable<string>;
  readonly customerId: string;
  readonly customerUserId?: Nullable<string>;
  readonly endsAt?: string;
  readonly serviceId: string;
  readonly startsAt: string;
}

export interface CreateBookingResponse {
  readonly bookingId: string;
  readonly serviceSnapshot: ServiceSnapshot;
}
