import type { RouteObject } from "react-router";
import { ROUTE_PATH } from "@/constants";
import { COLLABORATOR_PERMISSION, USER_ROLE } from "@/domain";
import { RequireRole } from "@/modules/auth";
import { BUSINESS_PROFILE_ALLOWED_ROLES } from "./businessProfileAccess";
import { BusinessLayout } from "./layout/BusinessLayout";
import {
  BusinessStatusGate,
  RequireCollaboratorPermission,
} from "./layout/components";

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
                  {
                    lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                      const { CollaboratorListPage } =
                        await import("./features/collaborators");
                      return { Component: CollaboratorListPage };
                    },
                    path: ROUTE_PATH.BUSINESS.COLLABORATORS,
                  },
                  {
                    lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                      const { CollaboratorFormPage } =
                        await import("./features/collaborators");
                      return { Component: CollaboratorFormPage };
                    },
                    path: ROUTE_PATH.BUSINESS.COLLABORATOR_NEW,
                  },
                  {
                    lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                      const { CollaboratorProfilePage } =
                        await import("./features/collaborators");
                      return { Component: CollaboratorProfilePage };
                    },
                    path: ROUTE_PATH.BUSINESS.COLLABORATOR_DETAIL,
                  },
                  {
                    lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                      const { CollaboratorFormPage } =
                        await import("./features/collaborators");
                      return { Component: CollaboratorFormPage };
                    },
                    path: ROUTE_PATH.BUSINESS.COLLABORATOR_EDIT,
                  },
                  {
                    lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                      const { CollaboratorPermissionsPage } =
                        await import("./features/collaborators");
                      return { Component: CollaboratorPermissionsPage };
                    },
                    path: ROUTE_PATH.BUSINESS.COLLABORATOR_PERMISSIONS,
                  },
                ],
                element: (
                  <RequireRole allowedRoles={BUSINESS_PROFILE_ALLOWED_ROLES} />
                ),
              },
              {
                children: [
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
                element: (
                  <RequireCollaboratorPermission
                    permission={COLLABORATOR_PERMISSION.MANAGE_SERVICES}
                  />
                ),
              },
              {
                lazy: async (): Promise<Pick<RouteObject, "Component">> => {
                  const { SchedulePage } = await import("./features/schedule");
                  return { Component: SchedulePage };
                },
                path: ROUTE_PATH.BUSINESS.SCHEDULE,
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
                  const { PasswordSettingsPage } =
                    await import("./features/settings");
                  return { Component: PasswordSettingsPage };
                },
                path: ROUTE_PATH.BUSINESS.SETTINGS_PASSWORD,
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
