import type { CollaboratorSelectionMode } from "../constants/ServiceCollaborators.constants";

export interface ServiceCollaboratorItem {
  readonly email: string;
  readonly fullName: string;
  readonly id: string;
  readonly isAssigned: boolean;
  readonly pendingOrConfirmedBookingsCount: number;
  readonly status: "active" | "invited";
}

export interface ServiceCollaboratorsData {
  readonly collaborators: readonly ServiceCollaboratorItem[];
  readonly currentSelectionMode: CollaboratorSelectionMode;
  readonly serviceName: string;
}
