import type { RouteObject } from "react-router";
import { RequireRole } from "@/features/auth";
import { ROUTE_PATH } from "@/shared/constants";
import { USER_ROLE } from "@/shared/domain";
import { AdminLayout } from "./layout/AdminLayout";

export const adminRoutes: RouteObject[] = [
  {
    children: [
      {
        children: [
          {
            index: true,
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { AdminPlaceholderPage } =
                await import("./placeholder/AdminPlaceholderPage");
              return { Component: AdminPlaceholderPage };
            },
          },
        ],
        element: <AdminLayout />,
      },
    ],
    element: <RequireRole allowedRoles={[USER_ROLE.SUPER_ADMIN]} />,
    path: ROUTE_PATH.ADMIN.ROOT,
  },
];
