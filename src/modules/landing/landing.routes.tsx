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
          const { TermsPage } = await import("./features/terms");
          return { Component: TermsPage };
        },
        path: ROUTE_PATH.LANDING.TERMS,
      },
    ],
    element: <LandingLayout />,
    path: ROUTE_PATH.LANDING.HOME,
  },
];
