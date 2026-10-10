import type { RouteObject } from "react-router";
import { ROUTE_PATH } from "@/constants";
import { USER_ROLE } from "@/domain";
import { RequireRole } from "@/modules/auth";
import { BusinessLayout } from "./layout/BusinessLayout";

// The subscriber and the collaborators of the business share this portal (Q1).
// What a collaborator sees inside it is limited by the permissions the
// subscriber grants (KAN-86); screens check them, and firestore.rules enforce
// them on the server.
export const businessRoutes: RouteObject[] = [
  {
    children: [
      {
        children: [
          {
            index: true,
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { BusinessHomePage } = await import("./features/home");
              return { Component: BusinessHomePage };
            },
          },
          {
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { ServiceFormPage } = await import("./features/services");
              return { Component: ServiceFormPage };
            },
            path: ROUTE_PATH.BUSINESS.SERVICE_NEW,
          },
        ],
        element: <BusinessLayout />,
      },
    ],
    element: (
      <RequireRole
        allowedRoles={[USER_ROLE.SUBSCRIBER, USER_ROLE.COLLABORATOR]}
      />
    ),
    path: ROUTE_PATH.BUSINESS.ROOT,
  },
];
