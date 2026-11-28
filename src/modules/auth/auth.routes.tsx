import type { RouteObject } from "react-router";
import { ROUTE_PATH } from "@/constants";
import { GuestOnly } from "./components/GuestOnly";

// Sign-in, recovery and reset are shared by every role. GuestOnly sends a signed-in user to their portal.
// The email action link sits outside GuestOnly: a signed-in user can open the
// verification link of their own account (KAN-126).
export const authRoutes: RouteObject[] = [
  {
    lazy: async (): Promise<Pick<RouteObject, "Component">> => {
      const { AuthActionPage } = await import("./AuthActionPage");
      return { Component: AuthActionPage };
    },
    path: ROUTE_PATH.AUTH.ACTION,
  },
  {
    children: [
      {
        lazy: async (): Promise<Pick<RouteObject, "Component">> => {
          const { SignInPage } = await import("./SignInPage");
          return { Component: SignInPage };
        },
        path: ROUTE_PATH.AUTH.SIGN_IN,
      },
      {
        lazy: async (): Promise<Pick<RouteObject, "Component">> => {
          const { PasswordRecoveryPage } =
            await import("./PasswordRecoveryPage");
          return { Component: PasswordRecoveryPage };
        },
        path: ROUTE_PATH.AUTH.PASSWORD_RECOVERY,
      },
      {
        lazy: async (): Promise<Pick<RouteObject, "Component">> => {
          const { PasswordResetPage } = await import("./PasswordResetPage");
          return { Component: PasswordResetPage };
        },
        path: ROUTE_PATH.AUTH.PASSWORD_RESET,
      },
    ],
    element: <GuestOnly />,
  },
];
