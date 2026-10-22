import type { RouteObject } from "react-router";
import { ROUTE_PATH } from "@/constants";
import { adminRoutes } from "@/modules/admin/admin.routes";
import { authRoutes, GuestOnly } from "@/modules/auth";
import { businessRoutes } from "@/modules/business/business.routes";
import { customerRoutes } from "@/modules/customer/customer.routes";
import { landingRoutes } from "@/modules/landing/landing.routes";
import { LandingLayout } from "@/modules/landing/layout/LandingLayout";
import { NotFoundPage } from "./pages/NotFoundPage";

// Joins the four portal route trees and the shared sign-in. Each portal wraps
// its own tree in the guard it needs (auth-and-roles §3).
export const appRoutes: RouteObject[] = [
  ...landingRoutes,
  {
    children: [
      {
        children: [
          {
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { PlanCheckoutPage } =
                await import("@/modules/landing/features/plan-checkout");
              return { Component: PlanCheckoutPage };
            },
            path: ROUTE_PATH.LANDING.PLAN_CHECKOUT,
          },
        ],
        element: <GuestOnly />,
      },
    ],
    element: <LandingLayout />,
  },
  ...authRoutes,
  ...businessRoutes,
  ...customerRoutes,
  ...adminRoutes,
  { Component: NotFoundPage, path: ROUTE_PATH.NOT_FOUND },
];
