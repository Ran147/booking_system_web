import type { ServiceCollaboratorItem } from "./ServiceCollaborators.interface";
import type { CollaboratorSelectionMode } from "../constants/ServiceCollaborators.constants";

export interface CollaboratorWarningInfo {
  readonly collaboratorId: string;
  readonly collaboratorName: string;
  readonly pendingOrConfirmedBookingsCount: number;
}

export interface ServiceCollaboratorsViewModel {
  readonly collaborators: readonly ServiceCollaboratorItem[];
  readonly hasCollaboratorsSelected: boolean;
  readonly isError: boolean;
  readonly isLoading: boolean;
  readonly isReadOnly: boolean;
  readonly isSaving: boolean;
  readonly onBack: () => void;
  readonly onRetry: () => void;
  readonly onSave: () => Promise<void>;
  readonly onSelectMode: (mode: CollaboratorSelectionMode) => void;
  readonly onToggleCollaborator: (collaboratorId: string) => void;
  readonly selectedCollaboratorIds: readonly string[];
  readonly selectedMode: CollaboratorSelectionMode;
  readonly serviceName: string;
  readonly warnings: readonly CollaboratorWarningInfo[];
}
