import type { RouteObject } from "react-router";
import { RequireRole } from "@/features/auth";
import { ROUTE_PATH } from "@/shared/constants";
import { USER_ROLE } from "@/shared/domain";
import { BusinessLayout } from "./layout/BusinessLayout";

export const businessRoutes: RouteObject[] = [
  {
    children: [
      {
        children: [
          {
            index: true,
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { BusinessPlaceholderPage } =
                await import("./placeholder/BusinessPlaceholderPage");
              return { Component: BusinessPlaceholderPage };
            },
          },
        ],
        element: <BusinessLayout />,
      },
    ],
    element: <RequireRole allowedRoles={[USER_ROLE.SUBSCRIBER]} />,
    path: ROUTE_PATH.BUSINESS.ROOT,
  },
];
