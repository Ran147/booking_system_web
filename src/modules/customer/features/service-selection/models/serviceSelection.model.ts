import type { ErrorMessageKey } from "@/shared/constants";
import type { Nullable } from "@/types";

/** customer namespace key of the validation error of the service step. */
export type ServiceSelectionMessageKey =
  "serviceSelection.errors.serviceRequired";

/** An active service the customer can book. */
export interface BookableService {
  readonly durationMinutes: number;
  readonly id: string;
  readonly name: string;
  readonly priceInCents: number;
}

/** The business and its active services, for the first booking step. */
export interface BookableCatalog {
  readonly currency: string;
  readonly services: readonly BookableService[];
}

/**
 * ViewModel of the minimal service step (AC-KAN-135-01, 04, 06, 08).
 * @property isEmpty - The business has no active service.
 * @property loadErrorKey - Common error of loading the services, shown with ErrorState.
 * @property validationKey - Validation message of this step (AC-KAN-135-04).
 */
export interface ServiceSelectionViewModel {
  readonly currency: string;
  readonly handleContinue: () => void;
  readonly handleRetry: () => void;
  readonly handleSelectService: (serviceId: string) => void;
  readonly isEmpty: boolean;
  readonly isLoading: boolean;
  readonly language: string;
  readonly loadErrorKey: Nullable<ErrorMessageKey>;
  readonly selectedServiceId: string;
  readonly services: readonly BookableService[];
  readonly validationKey: Nullable<ServiceSelectionMessageKey>;
}
