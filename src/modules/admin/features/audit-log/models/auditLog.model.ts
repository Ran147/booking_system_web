import type { AuditLogActionType, AuditLogEntry } from "@/domain";
import type { Nullable, PageCursor } from "@/types";

export interface AuditLogFilters {
  readonly actionType: Nullable<AuditLogActionType>;
  readonly from: Nullable<string>;
  readonly to: Nullable<string>;
}

export interface AuditLogFilterBarProps {
  readonly filters: AuditLogFilters;
  readonly hasActiveFilters: boolean;
  readonly isDateRangeInvalid: boolean;
  readonly isUnknownActionTypeInUrl: boolean;
  readonly onClearFilters: () => void;
  readonly onFilterChange: (newFilters: Partial<AuditLogFilters>) => void;
}

export interface AuditLogQueryParams {
  readonly filters?: AuditLogFilters;
  readonly pageCursor?: Nullable<PageCursor>;
  readonly pageSize?: number;
  readonly timeZone?: string;
}

export interface AuditLogViewModel {
  readonly activeEntry: Nullable<AuditLogEntry>;
  readonly closeModal: () => void;
  readonly entries: AuditLogEntry[];
  readonly filters: AuditLogFilters;
  readonly handleClearFilters: () => void;
  readonly handleFilterChange: (newFilters: Partial<AuditLogFilters>) => void;
  readonly hasActiveFilters: boolean;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly isDateRangeInvalid: boolean;
  readonly isError: boolean;
  readonly isLoading: boolean;
  readonly isModalOpen: boolean;
  readonly isUnknownActionTypeInUrl: boolean;
  readonly nextPage: () => void;
  readonly openModal: (entry: AuditLogEntry) => void;
  readonly pageNumber: number;
  readonly previousPage: () => void;
  readonly refetch: () => void;
  readonly totalCount: number;
}
