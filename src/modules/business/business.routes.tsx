import type { RouteObject } from "react-router";
import { ROUTE_PATH } from "@/constants";
import { USER_ROLE } from "@/domain";
import { RequireRole } from "@/modules/auth";
import { BusinessLayout } from "./layout/BusinessLayout";
import { BusinessStatusGate } from "./layout/components";

// The subscriber and the collaborators of the business share this portal (Q1).
// What a collaborator sees inside it is limited by the permissions the
// subscriber grants (KAN-86); screens check them, and firestore.rules enforce
// them on the server. A pending or rejected business sees only its status
// screen (BusinessStatusGate, AC-KAN-33-09 … 12).
export const businessRoutes: RouteObject[] = [
  {
    children: [
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
                children: [
                  {
                    lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                      const { BusinessProfilePage } =
                        await import("./features/business-profile");
                      return { Component: BusinessProfilePage };
                    },
                    path: ROUTE_PATH.BUSINESS.BUSINESS_PROFILE,
                  },
                ],
                element: (
                  <RequireRole
                    allowedRoles={[
                      USER_ROLE.BUSINESS_OWNER,
                      USER_ROLE.SUBSCRIBER,
                    ]}
                  />
                ),
              },
              {
                lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                  const { ServiceListPage } =
                    await import("./features/services");
                  return { Component: ServiceListPage };
                },
                path: ROUTE_PATH.BUSINESS.SERVICES,
              },
              {
                lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                  const { ServiceFormPage } =
                    await import("./features/services");
                  return { Component: ServiceFormPage };
                },
                path: ROUTE_PATH.BUSINESS.SERVICE_NEW,
              },
              {
                lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                  const { ServiceFormPage } =
                    await import("./features/services");
                  return { Component: ServiceFormPage };
                },
                path: ROUTE_PATH.BUSINESS.SERVICE_EDIT,
              },
              {
                lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                  const { SettingsPage } = await import("./features/settings");
                  return { Component: SettingsPage };
                },
                path: ROUTE_PATH.BUSINESS.SETTINGS,
              },
              {
                lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                  const { ServiceCollaboratorsPage } =
                    await import("./features/services");
                  return { Component: ServiceCollaboratorsPage };
                },
                path: ROUTE_PATH.BUSINESS.SERVICE_COLLABORATORS,
              },
              {
                lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                  const { ServiceDiscountsPage } =
                    await import("./features/services");
                  return { Component: ServiceDiscountsPage };
                },
                path: ROUTE_PATH.BUSINESS.SERVICE_DISCOUNTS,
              },
            ],
            element: <BusinessLayout />,
          },
        ],
        element: <BusinessStatusGate />,
      },
    ],
    element: (
      <RequireRole
        allowedRoles={[
          USER_ROLE.BUSINESS_OWNER,
          USER_ROLE.COLLABORATOR,
          USER_ROLE.SUBSCRIBER,
        ]}
      />
    ),
    path: ROUTE_PATH.BUSINESS.ROOT,
  },
];
