import type { ErrorMessageKey, ViewState } from "@/constants";
import type { Nullable } from "@/types";
import type { CustomerProfile } from "./CustomerProfile.interface";

/** Read-only state and actions exposed by the customer profile ViewModel. */
export interface UseProfileViewModelReturn {
  readonly errorMessageKey: ErrorMessageKey;
  readonly profile: Nullable<CustomerProfile>;
  readonly retry: () => void;
  readonly viewState: ViewState;
}
