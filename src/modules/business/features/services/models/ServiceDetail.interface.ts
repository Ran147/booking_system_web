import type {
  CollaboratorSelection,
  ServiceDiscount,
  ServiceStatus,
} from "@/domain";
import type { Nullable } from "@/types";

export interface ServiceDetail {
  readonly collaboratorSelection?: CollaboratorSelection;
  readonly description: string;
  readonly discounts?: readonly ServiceDiscount[];
  readonly durationMinutes: number;
  readonly features: readonly string[];
  readonly id: string;
  readonly imageUrl: Nullable<string>;
  readonly name: string;
  readonly priceInCents: number;
  readonly status: ServiceStatus;
}
