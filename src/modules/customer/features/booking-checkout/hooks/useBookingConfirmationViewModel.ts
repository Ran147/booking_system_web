import { useEffect, useRef } from "react";
import { useParams } from "react-router";
import { ROUTE_PATH, STRING } from "@/constants";
import { BOOKING_STATUS } from "@/domain";
import { useBookingDetailViewModel } from "@/modules/customer/features/my-bookings";
import type { NullableRef } from "@/types";
import type { BookingConfirmationViewModel } from "../models/bookingConfirmation.model";

/**
 * The booking just created, read from the server with the detail of My
 * bookings (US-150), so reloading shows the same booking (AC-KAN-149-04).
 */
export const useBookingConfirmationViewModel =
  (): BookingConfirmationViewModel => {
    const { businessSlug = STRING.EMPTY } = useParams();
    const detailViewModel = useBookingDetailViewModel();
    const headingReference = useRef<NullableRef<HTMLHeadingElement>>(null);
    const { detail } = detailViewModel;

    // The confirmation heading receives focus when the booking shows.
    useEffect(() => {
      if (detail) headingReference.current?.focus();
    }, [detail]);

    return {
      ...detailViewModel,
      businessHomePath: `/${businessSlug}`,
      headingReference,
      isPending: detailViewModel.detail?.status === BOOKING_STATUS.PENDING,
      myBookingsPath: `/${businessSlug}/${ROUTE_PATH.CUSTOMER.MY_BOOKINGS}`,
    };
  };
