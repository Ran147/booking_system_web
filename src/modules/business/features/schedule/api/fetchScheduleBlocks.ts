import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { firestore } from "@/services/firebase";
import type { ScheduleBlock } from "../models";
import { mapScheduleBlockDocument } from "./scheduleBlockDocument.schema";

export const fetchScheduleBlocks = async (
  businessId: string,
): Promise<ScheduleBlock[]> => {
  if (!businessId) {
    return [];
  }

  const blocksCollection = collection(
    firestore,
    "businesses",
    businessId,
    "scheduleBlocks",
  );
  const blocksQuery = query(blocksCollection, orderBy("startsAt", "asc"));
  const snapshot = await getDocs(blocksQuery);

  return snapshot.docs.map(mapScheduleBlockDocument);
};
