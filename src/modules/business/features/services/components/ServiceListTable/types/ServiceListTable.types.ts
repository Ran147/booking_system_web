import type { ServiceListItem } from "@/modules/business/features/services";

export interface ServiceListTableProps {
  readonly currency: string;
  readonly isReadOnly: boolean;
  readonly services: readonly ServiceListItem[];
}
