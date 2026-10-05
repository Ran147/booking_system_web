import type { ErrorMessageKey, ViewState } from "@/constants";
import type { Nullable } from "@/types";
import type { CustomerProfile } from "./CustomerProfile.interface";

export interface UseProfileViewModelReturn {
  errorMessageKey: ErrorMessageKey;
  profile: Nullable<CustomerProfile>;
  retry: () => void;
  viewState: ViewState;
}
