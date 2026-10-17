import type { ServiceStatus } from "@/domain";
import type { Nullable } from "@/types";

export interface ServiceDetail {
  readonly description: string;
  readonly durationMinutes: number;
  readonly features: readonly string[];
  readonly id: string;
  readonly imageUrl: Nullable<string>;
  readonly name: string;
  readonly priceInCents: number;
  readonly status: ServiceStatus;
}
