import type { RefObject } from "react";
import type { BookingDetailViewModel } from "@/modules/customer/features/my-bookings";
import type { NullableRef } from "@/types";

/**
 * ViewModel of the confirmation screen (KAN-149): the booking detail of My
 * bookings plus where to go next.
 * @property isPending - The business confirms by hand (AC-KAN-149-02).
 */
export interface BookingConfirmationViewModel extends BookingDetailViewModel {
  readonly businessHomePath: string;
  readonly headingReference: RefObject<NullableRef<HTMLHeadingElement>>;
  readonly isPending: boolean;
  readonly myBookingsPath: string;
}
