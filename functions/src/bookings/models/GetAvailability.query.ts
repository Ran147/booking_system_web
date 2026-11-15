import type { Nullable } from "../../shared/types/Nullable.js";

export interface GetAvailabilityPayload {
  readonly businessId: string;
  /** The collaborator the customer chose; omitted or `null` for "any". */
  readonly collaboratorId?: Nullable<string>;
  /** Local calendar day, `YYYY-MM-DD`, in the business time zone. */
  readonly date: string;
  readonly serviceId: string;
}

/** A free slot. Who would serve it is never sent (AC-KAN-142-02). */
export interface AvailableTimeSlot {
  /** ISO 8601 instant. */
  readonly endsAt: string;
  /** ISO 8601 instant. */
  readonly startsAt: string;
}

export interface GetAvailabilityResponse {
  readonly date: string;
  /** Free slots ordered by start; empty when the day has none. */
  readonly slots: readonly AvailableTimeSlot[];
  /** IANA time zone of the business, to show the times in it. */
  readonly timeZone: string;
}
