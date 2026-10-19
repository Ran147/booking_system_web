import type { BusinessStatus, UserRole } from "@/domain";
import type { ServiceCollaboratorsData } from "@/modules/business/features/services";

export interface ServiceCollaboratorsPageProps {
  readonly businessStatus?: BusinessStatus;
  readonly initialData?: ServiceCollaboratorsData;
  readonly onNavigate?: (path: string) => void;
  readonly serviceId?: string;
  readonly userPermissions?: readonly string[];
  readonly userRole?: UserRole;
}
