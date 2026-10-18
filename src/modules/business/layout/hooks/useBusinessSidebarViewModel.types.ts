import type { BusinessStatus } from "@/domain";

export interface UseBusinessSidebarViewModelOptions {
  readonly businessName?: string;
  readonly initialBusinessStatus?: BusinessStatus;
  readonly onNavigate?: (path: string) => void;
  readonly onSignOut?: () => void;
}
