import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { FUNCTION_NAME } from "@/constants";
import { callFunction, firestore } from "@/services/firebase";
import type { Nullable } from "@/types";
import type { ScheduleBlock } from "../models";
import { mapScheduleBlockDocument } from "./scheduleBlockDocument.schema";

interface FetchScheduleBlocksResponse {
  readonly blocks: Array<{
    readonly businessId: string;
    readonly collaboratorId: Nullable<string>;
    readonly createdAt: string;
    readonly endsAt: string;
    readonly id: string;
    readonly isFullDay: boolean;
    readonly reason: Nullable<string>;
    readonly startsAt: string;
    readonly updatedAt: string;
  }>;
}

export const fetchScheduleBlocks = async (
  businessId: string,
): Promise<ScheduleBlock[]> => {
  if (!businessId) {
    return [];
  }

  try {
    const blocksCollection = collection(
      firestore,
      "businesses",
      businessId,
      "scheduleBlocks",
    );
    const blocksQuery = query(blocksCollection, orderBy("startsAt", "asc"));
    const snapshot = await getDocs(blocksQuery);

    return snapshot.docs.map(mapScheduleBlockDocument);
  } catch {
    // If client read fails (permission denied or index missing in cloud), fallback to serverless function
    try {
      const response = await callFunction<
        { readonly businessId: string },
        FetchScheduleBlocksResponse
      >(FUNCTION_NAME.FETCH_SCHEDULE_BLOCKS, { businessId });

      return (response.blocks ?? []).map((rawBlock) => ({
        businessId: rawBlock.businessId,
        collaboratorId: rawBlock.collaboratorId,
        createdAt: new Date(rawBlock.createdAt),
        endsAt: new Date(rawBlock.endsAt),
        id: rawBlock.id,
        isFullDay: rawBlock.isFullDay,
        reason: rawBlock.reason,
        startsAt: new Date(rawBlock.startsAt),
        updatedAt: new Date(rawBlock.updatedAt),
      }));
    } catch {
      return [];
    }
  }
};
