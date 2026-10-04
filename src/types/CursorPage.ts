import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import type { Nullable } from "./Nullable";

export type PageCursor = QueryDocumentSnapshot<DocumentData>;

export interface CursorPage<Item> {
  items: Item[];
  nextCursor: Nullable<PageCursor>;
  totalCount: number;
}
