import { useEffect, useRef } from "react";
import { useParams } from "react-router";
import { ROUTE_PATH, STRING } from "@/constants";
import { BOOKING_STATUS } from "@/domain";
import {
  buildBookingDetailPath,
  useBookingDetailViewModel,
} from "@/modules/customer/features/my-bookings";
import type { NullableRef } from "@/types";
import type { BookingConfirmationViewModel } from "../models/bookingConfirmation.model";

// Statuses this screen describes; any other one is shown by the booking
// detail of My bookings.
const CONFIRMATION_STATUSES: readonly string[] = Object.freeze([
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.PENDING,
]);

/**
 * The booking just created, read from the server with the detail of My
 * bookings (US-150), so reloading shows the same booking (AC-KAN-149-04).
 */
export const useBookingConfirmationViewModel =
  (): BookingConfirmationViewModel => {
    const { bookingId = STRING.EMPTY, businessSlug = STRING.EMPTY } =
      useParams();
    const detailViewModel = useBookingDetailViewModel();
    const headingReference = useRef<NullableRef<HTMLHeadingElement>>(null);
    const { detail } = detailViewModel;

    // The confirmation heading receives focus when the booking shows.
    useEffect(() => {
      if (detail) headingReference.current?.focus();
    }, [detail]);

    // Reloading after the business cancelled the booking, or after it was
    // served, must not say "confirmed" (AC-KAN-149-04).
    const isNoLongerOpen = Boolean(
      detail && !CONFIRMATION_STATUSES.includes(detail.status),
    );

    return {
      ...detailViewModel,
      businessHomePath: `/${businessSlug}`,
      closedBookingPath: isNoLongerOpen
        ? buildBookingDetailPath(businessSlug, bookingId)
        : null,
      headingReference,
      isPending: detailViewModel.detail?.status === BOOKING_STATUS.PENDING,
      myBookingsPath: `/${businessSlug}/${ROUTE_PATH.CUSTOMER.MY_BOOKINGS}`,
    };
  };
