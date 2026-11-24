import type { BookingStatus } from "../../../shared/constants/BookingStatus.constants.js";
import type { Nullable } from "../../../shared/types/Nullable.js";

/** One opening range of a day, as wall-clock times ("HH:mm", 24 hours). */
export interface AvailabilityTimeRange {
  readonly closesAt: string;
  readonly opensAt: string;
}

/**
 * Opening ranges per day of the week (`monday` to `sunday`). A day with no
 * ranges, or missing, is closed. A gap between two ranges of the same day is
 * a break (spec KAN-139, D-1).
 */
export type AvailabilityBusinessHours = Readonly<
  Record<string, Nullable<readonly AvailabilityTimeRange[]>>
>;

/** A period of time that cannot be booked: a schedule block. */
export interface AvailabilityBlock {
  readonly endsAt: Date;
  readonly startsAt: Date;
}

/** A booking that may occupy a resource; only open statuses count. */
export interface AvailabilityBooking {
  readonly endsAt: Date;
  readonly startsAt: Date;
  readonly status: BookingStatus;
}

/**
 * Whoever serves the booking: an active collaborator that offers the service
 * (`id` is the collaborator id) or the business itself (`id` is `null`) when
 * the service has no collaborators.
 */
export interface AvailabilityResource {
  readonly blocks: readonly AvailabilityBlock[];
  readonly bookings: readonly AvailabilityBooking[];
  readonly id: Nullable<string>;
}

export interface ComputeFreeSlotsInput {
  /** Blocks of the whole business; they apply to every resource. */
  readonly businessBlocks: readonly AvailabilityBlock[];
  readonly businessHours: AvailabilityBusinessHours;
  /** Local calendar day to compute, `YYYY-MM-DD`, in the business time zone. */
  readonly date: string;
  readonly durationMinutes: number;
  /** The current instant; slots that start before it are dropped. */
  readonly now: Date;
  /** With no resources there are no free slots. */
  readonly resources: readonly AvailabilityResource[];
  /** IANA time zone of the business, for example `America/Costa_Rica`. */
  readonly timeZone: string;
}

export interface AvailabilitySlot {
  readonly endsAt: Date;
  /**
   * Resources free for this slot. Used by the server to assign a collaborator;
   * it must never be sent to the customer (AC-KAN-142-02).
   */
  readonly freeResourceIds: readonly Nullable<string>[];
  readonly startsAt: Date;
}
