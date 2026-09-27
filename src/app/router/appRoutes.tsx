import type { RouteObject } from "react-router";
import { adminRoutes } from "@/portals/admin/admin.routes";
import { businessRoutes } from "@/portals/business/business.routes";
import { customerRoutes } from "@/portals/customer/customer.routes";
import { landingRoutes } from "@/portals/landing/landing.routes";
import { ROUTE_PATH } from "@/shared/constants";
import { NotFoundPage } from "./pages/NotFoundPage";

// Joins the four portal route trees. Each portal wraps its own tree in the
// guard it needs (auth-and-roles §3).
export const appRoutes: RouteObject[] = [
  ...landingRoutes,
  {
    lazy: async (): Promise<Pick<RouteObject, "Component">> => {
      const { SignInPlaceholderPage } =
        await import("./pages/SignInPlaceholderPage");
      return { Component: SignInPlaceholderPage };
    },
    path: ROUTE_PATH.AUTH.SIGN_IN,
  },
  ...businessRoutes,
  ...customerRoutes,
  ...adminRoutes,
  { Component: NotFoundPage, path: ROUTE_PATH.NOT_FOUND },
];
