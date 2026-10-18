import type { ServiceStatus } from "@/domain";

export interface ServiceListFilters {
  readonly searchTerm: string;
  readonly status: ServiceStatus | "";
}
