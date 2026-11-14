import type { Nullable } from "../../shared/types/Nullable.js";

export interface ServiceSnapshot {
  readonly durationMinutes: number;
  readonly name: string;
  readonly priceInCents: number;
}

export interface CreateBookingPayload {
  readonly businessId: string;
  readonly collaboratorId?: Nullable<string>;
  /** Ignored: a customer always books for themselves (spec KAN-139, D-4). */
  readonly customerId?: string;
  readonly customerUserId?: Nullable<string>;
  /** Ignored: the end comes from the service duration (D-4). */
  readonly endsAt?: string;
  readonly serviceId: string;
  readonly startsAt: string;
}

export interface CreateBookingResponse {
  readonly bookingId: string;
  readonly serviceSnapshot: ServiceSnapshot;
}
