import type { ReactElement } from "react";
import { Navigate, Outlet } from "react-router";
import { Spinner } from "@/components/common";
import type { UserRole } from "@/domain";
import { ROLE_GATE_DECISION } from "../constants/RoleGateDecision.constants";
import { useRoleGate } from "../hooks/useRoleGate";
import { useRoleGateTargets } from "../hooks/useRoleGateTargets";

export interface RequireRoleProps {
  allowedRoles: readonly UserRole[];
}

export const RequireRole = ({
  allowedRoles,
}: RequireRoleProps): ReactElement => {
  const roleGateDecision = useRoleGate(allowedRoles);
  const { ownPortalPath, signInPath } = useRoleGateTargets();

  const elementByDecision = {
    [ROLE_GATE_DECISION.ALLOW]: <Outlet />,
    [ROLE_GATE_DECISION.REDIRECT_TO_OWN_PORTAL]: (
      <Navigate replace to={ownPortalPath} />
    ),
    [ROLE_GATE_DECISION.REDIRECT_TO_SIGN_IN]: (
      <Navigate replace to={signInPath} />
    ),
    [ROLE_GATE_DECISION.WAIT]: <Spinner />,
  } satisfies Record<typeof roleGateDecision, ReactElement>;

  return elementByDecision[roleGateDecision];
};
