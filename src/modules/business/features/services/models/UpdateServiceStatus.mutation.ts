import type { ServiceStatus } from "@/domain";

export interface UpdateServiceStatusPayload {
  readonly businessId: string;
  readonly serviceId: string;
  readonly status: ServiceStatus;
}

export interface UpdateServiceStatusResponse {
  readonly serviceId: string;
  readonly status: ServiceStatus;
}
