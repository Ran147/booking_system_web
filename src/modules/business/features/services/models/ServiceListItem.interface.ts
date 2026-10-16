import type { ServiceStatus } from "@/domain";

export interface ServiceListItem {
  readonly description?: string;
  readonly durationMinutes: number;
  readonly id: string;
  readonly name: string;
  readonly priceInCents: number;
  readonly status: ServiceStatus;
}
