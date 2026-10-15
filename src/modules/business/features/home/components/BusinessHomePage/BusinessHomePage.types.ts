import type { BusinessStatus } from "@/domain";

export interface BusinessHomePageProps {
  readonly initialBusinessStatus?: BusinessStatus;
  readonly onNavigate?: (path: string) => void;
}
