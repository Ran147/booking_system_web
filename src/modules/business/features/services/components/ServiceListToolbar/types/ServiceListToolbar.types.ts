export interface ServiceListToolbarProps {
  readonly hasActiveFilters: boolean;
  readonly onClearFilters: () => void;
  readonly onSearchChange: (searchTerm: string) => void;
  readonly onStatusChange: (status: string) => void;
  readonly searchTerm: string;
  readonly status: string;
}
