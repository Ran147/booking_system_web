import type { ViewState } from "@/constants";
import type { BusinessPublicProfile } from "@/domain";
import type { Nullable } from "@/types";

/** Shared public-business state owned by the customer portal layout. */
export interface CustomerLayoutViewModel {
  /** Business profile resolved from the slug in the current URL. */
  readonly businessProfile: Nullable<BusinessPublicProfile>;
  /** Retries the public profile request after a recoverable failure. */
  readonly retry: () => void;
  /** Current loading, error, empty or ready state of the public profile. */
  readonly viewState: ViewState;
}
