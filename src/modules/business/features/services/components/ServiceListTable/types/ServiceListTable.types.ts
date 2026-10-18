import type { ServiceListItem } from "@/modules/business/features/services";

export interface ServiceListTableProps {
  readonly currency: string;
  readonly isReadOnly: boolean;
  readonly onEditService?: (serviceId: string) => void;
  readonly services: readonly ServiceListItem[];
}
