import type { RouteObject } from "react-router";
import { RequireRole } from "@/features/auth";
import { ROUTE_PATH } from "@/shared/constants";
import { USER_ROLE } from "@/shared/domain";
import { CustomerLayout } from "./layout/CustomerLayout";

// Public business pages (catalog, availability) have no guard; their URL form
// is BLOCKED on Q4. Private pages (my bookings, profile) go inside the
// RequireRole branch.
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
        children: [],
        element: <RequireRole allowedRoles={[USER_ROLE.CUSTOMER]} />,
      },
    ],
    element: <CustomerLayout />,
    path: ROUTE_PATH.CUSTOMER.ROOT,
  },
];
