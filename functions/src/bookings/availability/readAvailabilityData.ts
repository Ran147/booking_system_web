import type {
  DocumentData,
  DocumentReference,
  Query,
  QuerySnapshot,
} from "firebase-admin/firestore";
import type { AvailabilityData } from "./models/AvailabilityData.model.js";
import { readFirestoreDate } from "./utils/readFirestoreDate.js";
import { COLLABORATOR_STATUS } from "../../shared/constants/CollaboratorStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";

/** Runs a query: `transaction.get` inside a transaction, `query.get` outside. */
export type AvailabilityQueryReader = (
  query: Query<DocumentData>,
) => Promise<QuerySnapshot<DocumentData>>;

interface ReadAvailabilityDataOptions {
  readonly businessReference: DocumentReference<DocumentData>;
  readonly readQuery: AvailabilityQueryReader;
  readonly serviceId: string;
  /** Only bookings starting and blocks ending inside this window are read. */
  readonly window: { readonly from: Date; readonly to: Date };
}

/**
 * Reads what the availability engine needs for one service: the collaborators
 * assigned to it, and the bookings and schedule blocks around the window.
 * Statuses are filtered later by the engine, so a cancelled booking is read
 * but never blocks a slot.
 */
export const readAvailabilityData = async ({
  businessReference,
  readQuery,
  serviceId,
  window,
}: ReadAvailabilityDataOptions): Promise<AvailabilityData> => {
  const collaboratorsCollection = businessReference.collection(
    FIRESTORE_COLLECTION.COLLABORATORS,
  );
  const [
    collaboratorsSnapshot,
    legacyCollaboratorsSnapshot,
    bookingsSnapshot,
    blocksSnapshot,
  ] = await Promise.all([
    readQuery(
      collaboratorsCollection.where("serviceIds", "array-contains", serviceId),
    ),
    // Q10: accounts created before the rename store the assignment as
    // service_ids. Read both until the data is migrated (Q10 step 3).
    readQuery(
      collaboratorsCollection.where("service_ids", "array-contains", serviceId),
    ),
    readQuery(
      businessReference
        .collection(FIRESTORE_COLLECTION.BOOKINGS)
        .where("startsAt", ">=", window.from)
        .where("startsAt", "<", window.to),
    ),
    readQuery(
      businessReference
        .collection(FIRESTORE_COLLECTION.SCHEDULE_BLOCKS)
        .where("endsAt", ">", window.from),
    ),
  ]);

  const blocks = blocksSnapshot.docs
    .map((blockDocument) => ({
      collaboratorId: blockDocument.get("collaboratorId") ?? null,
      endsAt: readFirestoreDate(blockDocument.get("endsAt")),
      startsAt: readFirestoreDate(blockDocument.get("startsAt")),
    }))
    .filter((block) => block.startsAt.getTime() < window.to.getTime());

  // A collaborator with both fields appears in both queries: keep one.
  const assignedCollaborators = [
    ...new Map(
      [...collaboratorsSnapshot.docs, ...legacyCollaboratorsSnapshot.docs].map(
        (collaboratorDocument) => [
          collaboratorDocument.id,
          collaboratorDocument,
        ],
      ),
    ).values(),
  ];

  return {
    activeCollaborators: assignedCollaborators
      .filter(
        (collaboratorDocument) =>
          collaboratorDocument.get("status") === COLLABORATOR_STATUS.ACTIVE,
      )
      .map((collaboratorDocument) => ({
        fullName: String(collaboratorDocument.get("fullName") ?? ""),
        id: collaboratorDocument.id,
      })),
    blocks,
    bookings: bookingsSnapshot.docs.map((bookingDocument) => ({
      collaboratorId: bookingDocument.get("collaboratorId") ?? null,
      customerUserId: bookingDocument.get("customerUserId") ?? null,
      endsAt: readFirestoreDate(bookingDocument.get("endsAt")),
      startsAt: readFirestoreDate(bookingDocument.get("startsAt")),
      status: bookingDocument.get("status"),
    })),
    hasAssignedCollaborators: assignedCollaborators.length > 0,
  };
};
