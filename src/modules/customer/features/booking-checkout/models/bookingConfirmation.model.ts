import type { RefObject } from "react";
import type { BookingDetailViewModel } from "@/modules/customer/features/my-bookings";
import type { Nullable, NullableRef } from "@/types";

/**
 * ViewModel of the confirmation screen (KAN-149): the booking detail of My
 * bookings plus where to go next.
 * @property closedBookingPath - The booking detail of My bookings when the
 *   booking is no longer pending or confirmed (cancelled, completed, no-show);
 *   the screen opens it instead of saying "confirmed".
 * @property isPending - The business confirms by hand (AC-KAN-149-02).
 */
export interface BookingConfirmationViewModel extends BookingDetailViewModel {
  readonly businessHomePath: string;
  readonly closedBookingPath: Nullable<string>;
  readonly headingReference: RefObject<NullableRef<HTMLHeadingElement>>;
  readonly isPending: boolean;
  readonly myBookingsPath: string;
}
