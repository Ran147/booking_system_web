import { useQuery } from "@tanstack/react-query";
import { ROUTE_PATH } from "@/constants";
import { USER_ROLE, type CollaboratorPermission } from "@/domain";
import { SESSION_STATUS, useCurrentBusiness, useSession } from "@/modules/auth";
import {
  businessLayoutQueryKeys,
  fetchCollaboratorProfile,
  type CollaboratorProfileData,
} from "../api";

export const COLLABORATOR_PERMISSION_GATE_DECISION = Object.freeze({
  ALLOW: "allow",
  REDIRECT: "redirect",
  WAIT: "wait",
} as const);

export type CollaboratorPermissionGateDecision =
  (typeof COLLABORATOR_PERMISSION_GATE_DECISION)[keyof typeof COLLABORATOR_PERMISSION_GATE_DECISION];

export interface CollaboratorPermissionGateResult {
  readonly decision: CollaboratorPermissionGateDecision;
  readonly redirectPath: string;
}

/**
 * Evalua si el usuario actual cumple con el permiso requerido para acceder a una ruta del portal (KAN-86).
 * @param {CollaboratorPermission} permission Permiso requerido para la ruta.
 * @returns {CollaboratorPermissionGateResult}
 */
export const useRequireCollaboratorPermissionViewModel = (
  permission: CollaboratorPermission,
): CollaboratorPermissionGateResult => {
  const session = useSession();
  const { businessId } = useCurrentBusiness();

  const isSignedIn = session.status === SESSION_STATUS.SIGNED_IN;
  const isCollaborator = isSignedIn && session.role === USER_ROLE.COLLABORATOR;
  const collaboratorId = isCollaborator ? (session.collaboratorId ?? "") : "";

  const collaboratorProfileQuery = useQuery<CollaboratorProfileData>({
    enabled: Boolean(isCollaborator && businessId && collaboratorId),
    queryFn: () => fetchCollaboratorProfile(businessId, collaboratorId),
    queryKey: businessLayoutQueryKeys.collaboratorProfile(
      businessId,
      collaboratorId,
    ),
  });

  if (session.status === SESSION_STATUS.LOADING) {
    return {
      decision: COLLABORATOR_PERMISSION_GATE_DECISION.WAIT,
      redirectPath: ROUTE_PATH.BUSINESS.ROOT,
    };
  }

  if (!isSignedIn) {
    return {
      decision: COLLABORATOR_PERMISSION_GATE_DECISION.REDIRECT,
      redirectPath: ROUTE_PATH.AUTH.SIGN_IN,
    };
  }

  if (
    session.role === USER_ROLE.SUBSCRIBER ||
    session.role === USER_ROLE.BUSINESS_OWNER
  ) {
    return {
      decision: COLLABORATOR_PERMISSION_GATE_DECISION.ALLOW,
      redirectPath: ROUTE_PATH.BUSINESS.ROOT,
    };
  }

  if (!isCollaborator || !collaboratorId) {
    return {
      decision: COLLABORATOR_PERMISSION_GATE_DECISION.REDIRECT,
      redirectPath: ROUTE_PATH.BUSINESS.ROOT,
    };
  }

  if (collaboratorProfileQuery.isPending) {
    return {
      decision: COLLABORATOR_PERMISSION_GATE_DECISION.WAIT,
      redirectPath: ROUTE_PATH.BUSINESS.ROOT,
    };
  }

  const permissions = collaboratorProfileQuery.data?.permissions ?? [];
  if (!permissions.includes(permission)) {
    return {
      decision: COLLABORATOR_PERMISSION_GATE_DECISION.REDIRECT,
      redirectPath: ROUTE_PATH.BUSINESS.ROOT,
    };
  }

  return {
    decision: COLLABORATOR_PERMISSION_GATE_DECISION.ALLOW,
    redirectPath: ROUTE_PATH.BUSINESS.ROOT,
  };
};
