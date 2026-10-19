import type { ReactElement } from "react";
import { Outlet } from "react-router";
import { IdleSessionGuard } from "@/modules/auth";

// Wraps every route: the inactivity sign-out watches the whole app, whatever
// the portal (US-38, KAN-133).
export const RootLayout = (): ReactElement => (
  <>
    <Outlet />
    <IdleSessionGuard />
  </>
);
