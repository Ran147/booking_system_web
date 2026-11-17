import { useQuery } from "@tanstack/react-query";
import { COLLABORATOR_PERMISSION, USER_ROLE } from "@/domain";
import { SESSION_STATUS, useCurrentBusiness, useSession } from "@/modules/auth";
import {
  businessLayoutQueryKeys,
  fetchCollaboratorProfile,
  type CollaboratorProfileData,
} from "@/modules/business/layout/api";

export interface SchedulePermissions {
  readonly canManageBookings: boolean;
  readonly canManageScheduleBlocks: boolean;
}

/**
 * Resuelve si el usuario actual en el portal puede gestionar reservas y bloqueos de agenda (AS-4, KAN-86).
 * Reutiliza el cache de `businessLayoutQueryKeys.collaboratorProfile` para evitar lecturas duplicadas a Firestore.
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

  const collaboratorProfileQuery = useQuery<CollaboratorProfileData>({
    enabled: Boolean(isCollaborator && businessId && collaboratorId),
    queryFn: () => fetchCollaboratorProfile(businessId, collaboratorId),
    queryKey: businessLayoutQueryKeys.collaboratorProfile(
      businessId,
      collaboratorId,
    ),
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

  const permissions = collaboratorProfileQuery.data?.permissions ?? [];

  return {
    canManageBookings: permissions.includes(
      COLLABORATOR_PERMISSION.MANAGE_BOOKINGS,
    ),
    canManageScheduleBlocks: permissions.includes(
      COLLABORATOR_PERMISSION.MANAGE_SCHEDULE_BLOCKS,
    ),
  };
};
