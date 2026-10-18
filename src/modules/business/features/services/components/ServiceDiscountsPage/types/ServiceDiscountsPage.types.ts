import type {
  BusinessInfo,
  ServiceDetail,
} from "@/modules/business/features/services";

export interface ServiceDiscountsPageProps {
  readonly businessInfo?: BusinessInfo;
  readonly initialService?: ServiceDetail;
  readonly onBack?: () => void;
  readonly serviceId?: string;
}
