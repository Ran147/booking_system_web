import type {
  AvailabilityBlock,
  AvailabilityBooking,
} from "./Availability.model.js";
import type { Nullable } from "../../../shared/types/Nullable.js";

/** An active collaborator assigned to the service. */
export interface AvailabilityCollaborator {
  readonly fullName: string;
  readonly id: string;
}

/** A booking with the collaborator it belongs to (`null`: the business). */
export interface AvailabilityStoredBooking extends AvailabilityBooking {
  readonly collaboratorId: Nullable<string>;
  readonly customerUserId: Nullable<string>;
}

/** A schedule block of one collaborator, or of the business when `null`. */
export interface AvailabilityStoredBlock extends AvailabilityBlock {
  readonly collaboratorId: Nullable<string>;
}

/** What `readAvailabilityData` reads from Firestore for one service. */
export interface AvailabilityData {
  /** Collaborators assigned to the service whose status is `active`. */
  readonly activeCollaborators: readonly AvailabilityCollaborator[];
  readonly blocks: readonly AvailabilityStoredBlock[];
  readonly bookings: readonly AvailabilityStoredBooking[];
  /**
   * Whether any collaborator, in any status, is assigned to the service. With
   * none, the business itself serves it as one resource; with some but none
   * active, nobody can serve it (AC-KAN-141-10).
   */
  readonly hasAssignedCollaborators: boolean;
}
