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
import { sliceCursorPage } from "./sliceCursorPage";
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
  // One more than the page: tells whether there is a next page (sliceCursorPage).
  const pageQuery = pageCursor
    ? query(filteredQuery, startAfter(pageCursor), limit(pageSize + 1))
    : query(filteredQuery, limit(pageSize + 1));

  const [pageSnapshot, countSnapshot] = await Promise.all([
    getDocs(pageQuery),
    getCountFromServer(filteredQuery),
  ]);
  const { hasMorePages, pageDocuments } = sliceCursorPage(
    pageSnapshot.docs,
    pageSize,
  );

  return {
    items: pageDocuments.map(mapMyBooking),
    nextCursor: hasMorePages ? (pageDocuments.at(-1) ?? null) : null,
    totalCount: countSnapshot.data().count,
  };
};
