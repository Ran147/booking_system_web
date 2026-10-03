import type { ReactElement } from "react";
import { Navigate, Outlet } from "react-router";
import { Spinner } from "@/shared/components";
import { ROUTE_PATH } from "@/shared/constants";
import type { UserRole } from "@/shared/domain";
import { ROLE_GATE_DECISION } from "../constants/RoleGateDecision.constants";
import { useRoleGate } from "../hooks/useRoleGate";

export interface RequireRoleProps {
  allowedRoles: readonly UserRole[];
}

export const RequireRole = ({
  allowedRoles,
}: RequireRoleProps): ReactElement => {
  const roleGateDecision = useRoleGate(allowedRoles);

  const elementByDecision = {
    [ROLE_GATE_DECISION.ALLOW]: <Outlet />,
    [ROLE_GATE_DECISION.REDIRECT_TO_OWN_PORTAL]: (
      <Navigate replace to={ROUTE_PATH.LANDING.HOME} />
    ),
    [ROLE_GATE_DECISION.REDIRECT_TO_SIGN_IN]: (
      <Navigate replace to={ROUTE_PATH.AUTH.SIGN_IN} />
    ),
    [ROLE_GATE_DECISION.WAIT]: <Spinner />,
  } satisfies Record<typeof roleGateDecision, ReactElement>;

  return elementByDecision[roleGateDecision];
};
