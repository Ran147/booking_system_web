export interface CursorPaginationProps {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPageClick: () => void;
  onPreviousPageClick: () => void;
  pageNumber: number;
  totalCount: number;
}
