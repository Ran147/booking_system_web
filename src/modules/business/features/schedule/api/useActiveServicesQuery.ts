import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { SERVICE_STATUS } from "@/domain";
import { firestore } from "@/services/firebase";
import { SCHEDULE_CONSTANTS } from "../constants";
import type { ActiveServiceOption } from "../models";

export const fetchActiveServices = async (
  businessId: string,
): Promise<ActiveServiceOption[]> => {
  if (!businessId) {
    return [];
  }

  const servicesCollection = collection(
    firestore,
    "businesses",
    businessId,
    "services",
  );
  const activeQuery = query(
    servicesCollection,
    where("status", "==", SERVICE_STATUS.ACTIVE),
  );
  const snapshot = await getDocs(activeQuery);

  return snapshot.docs.map((doc) => {
    const serviceDocData = doc.data();
    return {
      durationMinutes: Number(
        serviceDocData.durationMinutes ||
          SCHEDULE_CONSTANTS.DEFAULT_SLOT_DURATION_MINUTES,
      ),
      id: doc.id,
      name: String(serviceDocData.name || "Servicio"),
      priceInCents: Number(serviceDocData.priceInCents || 0),
    };
  });
};

export const useActiveServicesQuery = (
  businessId: string,
): UseQueryResult<ActiveServiceOption[], Error> => {
  return useQuery({
    enabled: Boolean(businessId),
    queryFn: () => fetchActiveServices(businessId),
    queryKey: ["business", "schedule", "active-services", businessId],
  });
};
