import type { BusinessStatus } from "@/domain";

export interface UseServiceListViewModelOptions {
  readonly businessStatus?: BusinessStatus;
  readonly onCreateService?: () => void;
}

export interface ServiceListViewModel {
  readonly handleCreateService: () => void;
  readonly isEmpty: boolean;
  readonly isLoading: boolean;
  readonly isReadOnly: boolean;
  readonly services: readonly unknown[];
}
