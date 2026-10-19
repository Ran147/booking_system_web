import type { UserRole } from "@/domain";
import type {
  BusinessInfo,
  ServiceDetail,
} from "@/modules/business/features/services";

export interface ServiceDiscountsPageProps {
  readonly businessInfo?: BusinessInfo;
  readonly initialService?: ServiceDetail;
  readonly onBack?: () => void;
  readonly onNavigate?: (path: string) => void;
  readonly serviceId?: string;
  readonly userPermissions?: readonly string[];
  readonly userRole?: UserRole;
}
