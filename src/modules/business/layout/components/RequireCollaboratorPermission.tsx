import type { ReactElement } from "react";
import { Navigate, Outlet } from "react-router";
import { Spinner } from "@/components/common";
import type { CollaboratorPermission } from "@/domain";
import {
  COLLABORATOR_PERMISSION_GATE_DECISION,
  useRequireCollaboratorPermissionViewModel,
} from "../hooks";

export interface RequireCollaboratorPermissionProps {
  readonly permission: CollaboratorPermission;
}

/**
 * Guard de ruta que verifica permisos de modulo para colaboradores en el portal del negocio (KAN-86).
 * Suscriptores y duenos siempre tienen acceso; los colaboradores requieren el permiso indicado.
 * @param {RequireCollaboratorPermissionProps} props Propiedades del guard.
 * @returns {ReactElement}
 */
export const RequireCollaboratorPermission = ({
  permission,
}: RequireCollaboratorPermissionProps): ReactElement => {
  const { decision, redirectPath } =
    useRequireCollaboratorPermissionViewModel(permission);

  const elementByDecision = {
    [COLLABORATOR_PERMISSION_GATE_DECISION.ALLOW]: <Outlet />,
    [COLLABORATOR_PERMISSION_GATE_DECISION.REDIRECT]: (
      <Navigate replace to={redirectPath} />
    ),
    [COLLABORATOR_PERMISSION_GATE_DECISION.WAIT]: <Spinner />,
  } satisfies Record<typeof decision, ReactElement>;

  return elementByDecision[decision];
};
