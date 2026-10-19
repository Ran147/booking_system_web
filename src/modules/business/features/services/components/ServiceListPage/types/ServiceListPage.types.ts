import type { BusinessStatus } from "@/domain";

export interface ServiceListPageProps {
  readonly businessStatus?: BusinessStatus;
  readonly currency?: string;
  readonly onCreateService?: () => void;
  readonly onEditService?: (serviceId: string) => void;
}
