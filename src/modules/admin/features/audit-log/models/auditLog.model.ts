import type { AuditLogEntry } from "@/domain";
import type { Nullable, PageCursor } from "@/types";

export interface AuditLogQueryParams {
  readonly pageCursor?: Nullable<PageCursor>;
  readonly pageSize?: number;
}

export interface AuditLogViewModel {
  readonly activeEntry: Nullable<AuditLogEntry>;
  readonly closeModal: () => void;
  readonly entries: AuditLogEntry[];
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly isError: boolean;
  readonly isLoading: boolean;
  readonly isModalOpen: boolean;
  readonly nextPage: () => void;
  readonly openModal: (entry: AuditLogEntry) => void;
  readonly pageNumber: number;
  readonly previousPage: () => void;
  readonly refetch: () => void;
  readonly totalCount: number;
}
