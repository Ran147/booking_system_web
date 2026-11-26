import type { ErrorMessageKey, ViewState } from "@/constants";
import type { NullableRef } from "@/types";

/**
 * @typedef {Object} CustomerPersonalProfile
 * @property {NullableRef<string>} email - Email stored in the own Firestore document.
 * @property {NullableRef<string>} fullName - Full name, without surrounding whitespace.
 * @property {NullableRef<string>} phone - Phone retaining its stored punctuation.
 */
export interface CustomerPersonalProfile {
  readonly email: NullableRef<string>;
  readonly fullName: NullableRef<string>;
  readonly phone: NullableRef<string>;
}

/**
 * @typedef {Object} CustomerProfileViewModel
 * @property {string} backPath - Current business home; never an identity source.
 * @property {ErrorMessageKey} errorMessageKey - Safe translated read error.
 * @property {boolean} isFetching - Whether a request is active.
 * @property {NullableRef<CustomerPersonalProfile>} profile - Only the current account's projection.
 * @property {() => void} handleRetry - Retry the current authorized read.
 * @property {ViewState} viewState - Derived loading, ready, empty or error state.
 */
export interface CustomerProfileViewModel {
  readonly backPath: string;
  readonly errorMessageKey: ErrorMessageKey;
  readonly handleRetry: () => void;
  readonly isFetching: boolean;
  readonly profile: NullableRef<CustomerPersonalProfile>;
  readonly viewState: ViewState;
}

/**
 * @typedef {Object} CustomerProfileDetailsProps
 * @property {CustomerPersonalProfile} profile - Whitelisted personal values only.
 */
export interface CustomerProfileDetailsProps {
  readonly profile: CustomerPersonalProfile;
}
