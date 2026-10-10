import type { RouteObject } from "react-router";
import { ROUTE_PATH } from "@/shared/constants";
import { LandingLayout } from "./layout/LandingLayout";

// Public portal: no guard (auth-and-roles §3).
export const landingRoutes: RouteObject[] = [
  {
    children: [
      {
        index: true,
        lazy: async (): Promise<Pick<RouteObject, "Component">> => {
          const { LandingPlaceholderPage } =
            await import("./placeholder/LandingPlaceholderPage");
          return { Component: LandingPlaceholderPage };
        },
      },
      {
        lazy: async (): Promise<Pick<RouteObject, "Component">> => {
          const { SubscriberSignUpPage } =
            await import("./features/subscriber-sign-up");
          return { Component: SubscriberSignUpPage };
        },
        path: ROUTE_PATH.LANDING.SIGN_UP,
      },
    ],
    element: <LandingLayout />,
    path: ROUTE_PATH.LANDING.HOME,
  },
];
