import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION } from "@/constants";
import { COLLABORATOR_PERMISSION, USER_ROLE } from "@/domain";
import { SESSION_STATUS, useCurrentBusiness, useSession } from "@/modules/auth";
import { firestore } from "@/services/firebase";

const collaboratorPermissionsSchema = z.object({
  permissions: z.array(z.string()).optional().default([]),
});

export interface SchedulePermissions {
  readonly canManageBookings: boolean;
  readonly canManageScheduleBlocks: boolean;
}

const fetchScheduleCollaboratorPermissions = async (
  businessId: string,
  collaboratorId: string,
): Promise<readonly string[]> => {
  const collaboratorRef = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.COLLABORATORS,
    collaboratorId,
  );
  const snapshot = await getDoc(collaboratorRef);

  if (!snapshot.exists()) {
    return [];
  }

  return collaboratorPermissionsSchema.parse(snapshot.data() ?? {}).permissions;
};

/**
 * Resuelve si el usuario actual en el portal puede gestionar reservas y bloqueos de agenda (AS-4, KAN-86).
 * Suscriptores y duenos siempre tienen acceso; colaboradores dependen de sus permisos asignados.
 * @returns {SchedulePermissions}
 */
export const useCollaboratorPermissionsQuery = (): SchedulePermissions => {
  const session = useSession();
  const { businessId } = useCurrentBusiness();

  const isSignedIn = session.status === SESSION_STATUS.SIGNED_IN;
  const isSubscriber =
    isSignedIn &&
    (session.role === USER_ROLE.SUBSCRIBER ||
      session.role === USER_ROLE.BUSINESS_OWNER);
  const isCollaborator = isSignedIn && session.role === USER_ROLE.COLLABORATOR;
  const collaboratorId = isCollaborator ? (session.collaboratorId ?? "") : "";

  const permissionsQuery = useQuery<readonly string[]>({
    enabled: Boolean(isCollaborator && businessId && collaboratorId),
    queryFn: () =>
      fetchScheduleCollaboratorPermissions(businessId, collaboratorId),
    queryKey: [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.COLLABORATORS,
      collaboratorId,
    ] as const,
  });

  if (isSubscriber) {
    return {
      canManageBookings: true,
      canManageScheduleBlocks: true,
    };
  }

  if (!isCollaborator) {
    return {
      canManageBookings: false,
      canManageScheduleBlocks: false,
    };
  }

  const permissions = permissionsQuery.data ?? [];

  return {
    canManageBookings: permissions.includes(
      COLLABORATOR_PERMISSION.MANAGE_BOOKINGS,
    ),
    canManageScheduleBlocks: permissions.includes(
      COLLABORATOR_PERMISSION.MANAGE_SCHEDULE_BLOCKS,
    ),
  };
};
