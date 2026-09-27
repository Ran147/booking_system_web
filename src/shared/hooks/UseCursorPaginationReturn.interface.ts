import type { Nullable, PageCursor } from "@/shared/types";

export interface UseCursorPaginationReturn {
  currentCursor: Nullable<PageCursor>;
  goToNextPage: (nextCursor: PageCursor) => void;
  goToPreviousPage: () => void;
  hasPreviousPage: boolean;
  pageNumber: number;
}
