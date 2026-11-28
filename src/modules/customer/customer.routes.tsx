import type { RouteObject } from "react-router";
import { ROUTE_PATH } from "@/constants";
import { USER_ROLE } from "@/domain";
import { GuestOnly, RequireRole } from "@/modules/auth";
import { CustomerLayout } from "./layout/CustomerLayout";

// The customer portal lives under the business slug: /:businessSlug/... (Q4).
// Static top-level routes (landing, auth, business, admin) rank above this
// dynamic segment in React Router, and their segments are reserved slugs
// (RESERVED_BUSINESS_SLUG). Public business pages (home, catalog, service
// details) have no guard; the sign-up is for visitors only. The booking flow,
// my bookings and profile go inside the RequireRole branch: booking needs a
// customer account (Q6).
export const customerRoutes: RouteObject[] = [
  {
    children: [
      {
        index: true,
        lazy: async (): Promise<Pick<RouteObject, "Component">> => {
          const { CustomerPlaceholderPage } =
            await import("./placeholder/CustomerPlaceholderPage");
          return { Component: CustomerPlaceholderPage };
        },
      },
      {
        // KAN-123: a signed-in user is sent to their own portal (GuestOnly).
        children: [
          {
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { CustomerSignUpPage } =
                await import("./features/customer-sign-up");
              return { Component: CustomerSignUpPage };
            },
            path: ROUTE_PATH.CUSTOMER.SIGN_UP,
          },
        ],
        element: <GuestOnly />,
      },
      {
        children: [
          {
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { ServiceSelectionPage } =
                await import("./features/service-selection");
              return { Component: ServiceSelectionPage };
            },
            path: ROUTE_PATH.CUSTOMER.BOOK,
          },
          {
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { AvailabilityPage } =
                await import("./features/availability");
              return { Component: AvailabilityPage };
            },
            path: ROUTE_PATH.CUSTOMER.BOOK_SERVICE,
          },
          {
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { BookingCheckoutPage } =
                await import("./features/booking-checkout");
              return { Component: BookingCheckoutPage };
            },
            path: ROUTE_PATH.CUSTOMER.BOOK_CONFIRM,
          },
          {
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { BookingConfirmationPage } =
                await import("./features/booking-checkout");
              return { Component: BookingConfirmationPage };
            },
            path: ROUTE_PATH.CUSTOMER.BOOK_DONE,
          },
          {
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { MyBookingsPage } = await import("./features/my-bookings");
              return { Component: MyBookingsPage };
            },
            path: ROUTE_PATH.CUSTOMER.MY_BOOKINGS,
          },
          {
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { BookingDetailPage } =
                await import("./features/my-bookings");
              return { Component: BookingDetailPage };
            },
            path: ROUTE_PATH.CUSTOMER.BOOKING_DETAIL,
          },
        ],
        element: (
          <RequireRole allowedRoles={[USER_ROLE.CLIENT, USER_ROLE.CUSTOMER]} />
        ),
      },
    ],
    element: <CustomerLayout />,
    path: ROUTE_PATH.CUSTOMER.ROOT,
  },
];
