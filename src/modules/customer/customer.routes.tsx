import type { RouteObject } from "react-router";
import { ROUTE_PATH } from "@/constants";
import { USER_ROLE } from "@/domain";
import { RequireRole } from "@/modules/auth";
import { CustomerLayout } from "./layout/CustomerLayout";

// The customer portal lives under the business slug: /:businessSlug/... (Q4).
// Static top-level routes (landing, auth, business, admin) rank above this
// dynamic segment in React Router, and their segments are reserved slugs
// (RESERVED_BUSINESS_SLUG). Public business pages (home, catalog, service
// details) have no guard. The booking flow, my bookings and profile go inside
// the RequireRole branch: booking needs a customer account (Q6).
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
        children: [
          {
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { ThemePreferencePage } =
                await import("./features/theme-preference/ThemePreferencePage");
              return { Component: ThemePreferencePage };
            },
            path: ROUTE_PATH.CUSTOMER.PROFILE_THEME,
          },
        ],
        element: <RequireRole allowedRoles={[USER_ROLE.CUSTOMER]} />,
      },
    ],
    element: <CustomerLayout />,
    path: ROUTE_PATH.CUSTOMER.ROOT,
  },
];
