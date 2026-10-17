import type { ViewState } from "@/constants";
import type { BusinessStatus } from "@/domain";
import type { ServiceListFilters } from "./ServiceListFilters.interface";
import type { ServiceListItem } from "./ServiceListItem.interface";

export interface UseServiceListViewModelOptions {
  readonly businessStatus?: BusinessStatus;
  readonly currency?: string;
  readonly onCreateService?: () => void;
  readonly onEditService?: (serviceId: string) => void;
}

export interface ServiceListViewModel {
  readonly currency: string;
  readonly filters: ServiceListFilters;
  readonly handleClearFilters: () => void;
  readonly handleCreateService: () => void;
  readonly handleEditService: (serviceId: string) => void;
  readonly handleNextPage: () => void;
  readonly handlePreviousPage: () => void;
  readonly handleRetry: () => void;
  readonly handleSearchChange: (searchTerm: string) => void;
  readonly handleStatusChange: (status: string) => void;
  readonly hasActiveFilters: boolean;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly isEmpty: boolean;
  readonly isNoResults: boolean;
  readonly isReadOnly: boolean;
  readonly pageNumber: number;
  readonly services: readonly ServiceListItem[];
  readonly totalCount: number;
  readonly viewState: ViewState;
}
