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
import { zonedDayBounds } from "../utils/zonedDayBounds";

export const fetchMyBookingsPage = async ({
  customerUserId,
  filters,
  pageCursor,
  pageSize,
  tab,
  timeZone,
}: MyBookingsQueryParams): Promise<CursorPage<MyBooking>> => {
  const filteredQuery = buildMyBookingsQuery({
    customerUserId,
    filters,
    firestore,
    now: new Date(),
    rangeEnd: filters.to ? zonedDayBounds(filters.to, timeZone).end : null,
    rangeStart: filters.from
      ? zonedDayBounds(filters.from, timeZone).start
      : null,
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
