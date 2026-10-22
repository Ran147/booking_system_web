import type { ReactElement } from "react";
import { Navigate } from "react-router";
import { ROUTE_PATH } from "@/shared/constants";

export const PlansRedirectPage = (): ReactElement => (
  <Navigate replace to={`${ROUTE_PATH.LANDING.HOME}#plans-section`} />
);
