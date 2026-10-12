import type { ViewState } from "@/constants";
import type { BusinessPublicProfile } from "@/domain";
import type { Nullable } from "@/types";

/** View state exposed to the business public profile page. */
export interface BusinessProfilePageViewModel {
  /** Loaded profile, or null until the query succeeds. */
  profile: Nullable<BusinessPublicProfile>;
  /** Retries the profile query after an error. */
  retry: () => void;
  /** Current loading, error, empty or ready state. */
  viewState: ViewState;
}
