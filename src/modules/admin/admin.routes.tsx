import type { RouteObject } from "react-router";
import { RequireRole } from "@/modules/auth";
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
          {
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { AuditLogPage } =
                await import("./features/audit-log/AuditLogPage");
              return { Component: AuditLogPage };
            },
            path: ROUTE_PATH.ADMIN.AUDIT_LOG,
          },
        ],
        element: <AdminLayout />,
      },
    ],
    element: <RequireRole allowedRoles={[USER_ROLE.SUPER_ADMIN]} />,
    path: ROUTE_PATH.ADMIN.ROOT,
  },
];
