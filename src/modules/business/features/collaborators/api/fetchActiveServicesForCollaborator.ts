import { collection, getDocs, query, where } from "firebase/firestore";
import { FIRESTORE_COLLECTION, FIRESTORE_OPERATOR } from "@/constants";
import { SERVICE_STATUS } from "@/domain";
import { firestore } from "@/services/firebase";
import { mapActiveServiceOption } from "./CollaboratorDocument.schema";
import { COLLABORATOR_FIELD } from "../constants/CollaboratorFeature.constants";
import type { ActiveServiceOption } from "../models";

export const fetchActiveServicesForCollaborator = async (
  businessId: string,
): Promise<readonly ActiveServiceOption[]> => {
  const servicesCollection = collection(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.SERVICES,
  );
  const activeQuery = query(
    servicesCollection,
    where(
      COLLABORATOR_FIELD.STATUS,
      FIRESTORE_OPERATOR.EQUAL,
      SERVICE_STATUS.ACTIVE,
    ),
  );
  const querySnapshot = await getDocs(activeQuery);
  return querySnapshot.docs
    .map(mapActiveServiceOption)
    .sort((firstService, secondService) =>
      firstService.name.localeCompare(secondService.name),
    );
};
