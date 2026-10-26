import type { RouteObject } from "react-router";
import { GuestOnly } from "@/modules/auth";
import { ROUTE_PATH } from "@/shared/constants";
import { LandingLayout } from "./layout/LandingLayout";

// Public portal: no role guard (auth-and-roles §3). Sign-up is only for
// visitors: GuestOnly sends a signed-in user to their portal (AC-KAN-27-04).
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
          const { ContactPage } = await import("./features/contact");
          return { Component: ContactPage };
        },
        path: ROUTE_PATH.LANDING.CONTACT,
      },
      {
        lazy: async (): Promise<Pick<RouteObject, "Component">> => {
          const { FaqPage } = await import("./features/faq");
          return { Component: FaqPage };
        },
        path: ROUTE_PATH.LANDING.FAQ,
      },
      {
        lazy: async (): Promise<Pick<RouteObject, "Component">> => {
          const { HelpPage } = await import("./features/help");
          return { Component: HelpPage };
        },
        path: ROUTE_PATH.LANDING.HELP,
      },
      {
        lazy: async (): Promise<Pick<RouteObject, "Component">> => {
          const { PlansRedirectPage } =
            await import("./features/home/components/PlansRedirectPage");
          return { Component: PlansRedirectPage };
        },
        path: ROUTE_PATH.LANDING.PLANS,
      },
      {
        lazy: async (): Promise<Pick<RouteObject, "Component">> => {
          const { PlanDetailPage } = await import("./features/plan-checkout");
          return { Component: PlanDetailPage };
        },
        path: ROUTE_PATH.LANDING.PLAN_DETAIL,
      },
      {
        lazy: async (): Promise<Pick<RouteObject, "Component">> => {
          const { TermsPage } = await import("./features/terms");
          return { Component: TermsPage };
        },
        path: ROUTE_PATH.LANDING.TERMS,
      },
      {
        children: [
          {
            lazy: async (): Promise<Pick<RouteObject, "Component">> => {
              const { SubscriberSignUpPage } =
                await import("./features/subscriber-sign-up");
              return { Component: SubscriberSignUpPage };
            },
            path: ROUTE_PATH.LANDING.SIGN_UP,
          },
        ],
        element: <GuestOnly />,
      },
    ],
    element: <LandingLayout />,
    path: ROUTE_PATH.LANDING.HOME,
  },
];
