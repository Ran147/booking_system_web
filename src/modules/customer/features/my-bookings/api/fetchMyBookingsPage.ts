import {
  getCountFromServer,
  getDocs,
  limit,
  query,
  startAfter,
} from "firebase/firestore";
import { firestore } from "@/services";
import type { CursorPage } from "@/shared/types";
import { mapMyBooking } from "./bookingDocument.schema";
import { buildMyBookingsQuery } from "./buildMyBookingsQuery";
import type { MyBooking, MyBookingsQueryParams } from "../models";

export const fetchMyBookingsPage = async ({
  customerUserId,
  pageCursor,
  pageSize,
  tab,
}: MyBookingsQueryParams): Promise<CursorPage<MyBooking>> => {
  const filteredQuery = buildMyBookingsQuery({
    customerUserId,
    firestore,
    now: new Date(),
    tab,
  });
  const pageQuery = pageCursor
    ? query(filteredQuery, startAfter(pageCursor), limit(pageSize))
    : query(filteredQuery, limit(pageSize));

  const [pageSnapshot, countSnapshot] = await Promise.all([
    getDocs(pageQuery),
    getCountFromServer(filteredQuery),
  ]);
  const hasMorePages = pageSnapshot.docs.length === pageSize;

  return {
    items: pageSnapshot.docs.map(mapMyBooking),
    nextCursor: hasMorePages ? (pageSnapshot.docs.at(-1) ?? null) : null,
    totalCount: countSnapshot.data().count,
  };
};
