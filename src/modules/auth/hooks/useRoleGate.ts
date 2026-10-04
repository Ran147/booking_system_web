import type { UserRole } from "@/shared/domain";
import { useSession } from "./useSession";
import {
  ROLE_GATE_DECISION,
  type RoleGateDecision,
} from "../constants/RoleGateDecision.constants";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";

export const useRoleGate = (
  allowedRoles: readonly UserRole[],
): RoleGateDecision => {
  const session = useSession();

  if (session.status === SESSION_STATUS.LOADING) return ROLE_GATE_DECISION.WAIT;
  if (session.status === SESSION_STATUS.SIGNED_OUT) {
    return ROLE_GATE_DECISION.REDIRECT_TO_SIGN_IN;
  }
  return allowedRoles.includes(session.role)
    ? ROLE_GATE_DECISION.ALLOW
    : ROLE_GATE_DECISION.REDIRECT_TO_OWN_PORTAL;
};
