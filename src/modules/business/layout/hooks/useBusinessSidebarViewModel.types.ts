import type { BusinessStatus } from "@/domain";
import type { Nullable } from "@/types";

export interface UseBusinessSidebarViewModelOptions {
  readonly businessName?: string;
  readonly collaboratorName?: string;
  readonly hasUnsavedChanges?: boolean;
  readonly initialBusinessStatus?: BusinessStatus;
  readonly logoUrl?: Nullable<string>;
  readonly onNavigate?: (path: string) => void;
  readonly onSignOut?: () => void;
  readonly referenceDate?: unknown;
}
