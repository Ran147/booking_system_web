import type { ServiceDiscount } from "@/domain";

export interface UpdateServiceDiscountsPayload {
  readonly businessId: string;
  readonly discounts: readonly ServiceDiscount[];
  readonly serviceId: string;
}

export interface UpdateServiceDiscountsResponse {
  readonly serviceId: string;
}
