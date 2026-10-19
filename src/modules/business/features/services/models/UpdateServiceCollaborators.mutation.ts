import type { Nullable } from "@/types";
import type { CollaboratorSelectionMode } from "../constants/ServiceCollaborators.constants";

export interface UpdateServiceCollaboratorsPayload {
  readonly businessId: string;
  readonly collaboratorIds: readonly string[];
  readonly collaboratorSelection: Nullable<CollaboratorSelectionMode>;
  readonly serviceId: string;
}

export interface UpdateServiceCollaboratorsResponse {
  readonly updatedServiceId: string;
}
