import type {
  AvailabilityBlock,
  AvailabilityResource,
} from "./models/Availability.model.js";
import type { AvailabilityData } from "./models/AvailabilityData.model.js";
import type { Nullable } from "../../shared/types/Nullable.js";

export interface AvailabilityResources {
  /** Blocks of the whole business (`collaboratorId` is `null`). */
  readonly businessBlocks: readonly AvailabilityBlock[];
  readonly resources: readonly AvailabilityResource[];
}

/**
 * Turns what was read into the engine's resources (spec KAN-139 §3.2):
 * - a service without assigned collaborators is served by the business as
 *   one resource (`id: null`), busy with the bookings that have no
 *   collaborator;
 * - otherwise each active assigned collaborator is a resource, busy with
 *   their own bookings and blocks;
 * - with a chosen collaborator only that one counts (AC-KAN-142-01); if they
 *   are not an active assigned collaborator there is no resource
 *   (AC-KAN-144-09).
 */
export const buildAvailabilityResources = (
  {
    activeCollaborators,
    blocks,
    bookings,
    hasAssignedCollaborators,
  }: AvailabilityData,
  chosenCollaboratorId: Nullable<string> = null,
): AvailabilityResources => {
  const businessBlocks = blocks.filter((block) => !block.collaboratorId);

  if (!hasAssignedCollaborators) {
    return {
      businessBlocks,
      resources: chosenCollaboratorId
        ? []
        : [
            {
              blocks: [],
              bookings: bookings.filter((booking) => !booking.collaboratorId),
              id: null,
            },
          ],
    };
  }

  return {
    businessBlocks,
    resources: activeCollaborators
      .filter(
        (collaborator) =>
          !chosenCollaboratorId || collaborator.id === chosenCollaboratorId,
      )
      .map((collaborator) => ({
        blocks: blocks.filter(
          (block) => block.collaboratorId === collaborator.id,
        ),
        bookings: bookings.filter(
          (booking) => booking.collaboratorId === collaborator.id,
        ),
        id: collaborator.id,
      })),
  };
};
