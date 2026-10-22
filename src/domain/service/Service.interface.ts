import type { Nullable } from "@/types";
import type { ServiceStatus } from "./ServiceStatus.constants";

export interface ServiceDiscount {
  readonly endsAt: Date;
  readonly startsAt: Date;
  readonly type: "fixed_amount" | "percentage";
  readonly value: number;
}

export type CollaboratorSelection = "automatic" | "customer_choice";

export interface Service {
  readonly businessId: string;
  readonly collaboratorSelection?: CollaboratorSelection;
  readonly createdAt?: Date;
  readonly description: string;
  readonly discounts?: readonly ServiceDiscount[];
  readonly durationMinutes: number;
  readonly features: readonly string[];
  readonly id: string;
  readonly imageUrl: Nullable<string>;
  readonly name: string;
  readonly priceInCents: number;
  readonly searchName: string;
  readonly status: ServiceStatus;
  readonly updatedAt?: Date;
}
