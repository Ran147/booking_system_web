import type { ServiceListItem } from "@/modules/business/features/services";

export interface ServiceListTableProps {
  readonly currency: string;
  readonly isReadOnly: boolean;
  readonly onActivateService?: (serviceId: string) => void;
  readonly onEditService?: (serviceId: string) => void;
  readonly onNavigateToCollaborators?: (serviceId: string) => void;
  readonly onNavigateToDiscounts?: (serviceId: string) => void;
  readonly onOpenDeactivateModal?: (serviceId: string) => void;
  readonly onOpenDeleteModal?: (serviceId: string) => void;
  readonly services: readonly ServiceListItem[];
}
