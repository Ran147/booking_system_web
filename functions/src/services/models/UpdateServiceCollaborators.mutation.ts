import type { Nullable } from "../../shared/types/Nullable.js";

export interface UpdateServiceCollaboratorsPayload {
  readonly businessId: string;
  readonly collaboratorIds: readonly string[];
  readonly collaboratorSelection?: Nullable<"customer_choice" | "automatic">;
  readonly serviceId: string;
}

export interface UpdateServiceCollaboratorsResponse {
  readonly updatedServiceId: string;
}
