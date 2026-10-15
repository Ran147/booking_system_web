import type { RouteObject } from "react-router";
import { ROUTE_PATH } from "@/constants";
import { GuestOnly } from "./components/GuestOnly";

// Shared by every role. GuestOnly sends a signed-in user to their portal.
export const authRoutes: RouteObject[] = [
  {
    children: [
      {
        lazy: async (): Promise<Pick<RouteObject, "Component">> => {
          const { SignInPage } = await import("./SignInPage");
          return { Component: SignInPage };
        },
        path: ROUTE_PATH.AUTH.SIGN_IN,
      },
    ],
    element: <GuestOnly />,
  },
];
