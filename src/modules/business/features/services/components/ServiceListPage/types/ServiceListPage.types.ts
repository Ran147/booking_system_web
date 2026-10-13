import type { BusinessStatus } from "@/domain";

export interface ServiceListPageProps {
  readonly businessStatus?: BusinessStatus;
  readonly onCreateService?: () => void;
}
