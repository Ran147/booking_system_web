import type { BusinessStatus } from "@/domain";

export interface UseBusinessHomeViewModelOptions {
  readonly initialBusinessStatus?: BusinessStatus;
  readonly onNavigate?: (path: string) => void;
}
