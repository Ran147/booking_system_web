import type { RouteObject } from "react-router";
import { ROUTE_PATH } from "@/constants";
import { adminRoutes } from "@/modules/admin/admin.routes";
import { authRoutes } from "@/modules/auth";
import { businessRoutes } from "@/modules/business/business.routes";
import { customerRoutes } from "@/modules/customer/customer.routes";
import { landingRoutes } from "@/modules/landing/landing.routes";
import { NotFoundPage } from "./pages/NotFoundPage";

// Joins the four portal route trees and the shared sign-in. Each portal wraps
// its own tree in the guard it needs (auth-and-roles §3).
export const appRoutes: RouteObject[] = [
  ...landingRoutes,
  ...authRoutes,
  ...businessRoutes,
  ...customerRoutes,
  ...adminRoutes,
  { Component: NotFoundPage, path: ROUTE_PATH.NOT_FOUND },
];
