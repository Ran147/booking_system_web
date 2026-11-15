import type { ErrorMessageKey } from "@/shared/constants";
import type { Nullable } from "@/types";
import type { AvailabilityErrorAction } from "../constants/Availability.constants";

/** Opening ranges per weekday (`monday` … `sunday`), "HH:mm" in the business time zone. */
export type BookingBusinessHours = Readonly<
  Record<
    string,
    Nullable<readonly { readonly closesAt: string; readonly opensAt: string }[]>
  >
>;

/**
 * What the availability step needs to know about the business and the
 * service before asking for slots.
 */
export interface BookingContext {
  readonly businessHours: BookingBusinessHours;
  readonly businessId: string;
  readonly currency: Nullable<string>;
  readonly durationMinutes: number;
  readonly serviceId: string;
  readonly serviceName: string;
  /** IANA time zone of the business. */
  readonly timeZone: string;
}

/** A free slot as the server sends it: ISO 8601 instants. */
export interface AvailableSlot {
  readonly endsAt: string;
  readonly startsAt: string;
}

/** The answer of `getAvailability` for one local day. */
export interface DayAvailability {
  readonly date: string;
  readonly slots: readonly AvailableSlot[];
  readonly timeZone: string;
}

export interface AvailabilityQueryParams {
  readonly businessId: string;
  readonly collaboratorId: Nullable<string>;
  readonly date: string;
  readonly serviceId: string;
}

/** One day of the week strip. */
export interface WeekDay {
  /** YYYY-MM-DD in the business time zone. */
  readonly date: string;
  readonly isDisabled: boolean;
  readonly isToday: boolean;
}

/** customer namespace keys an availability error can show. */
export type AvailabilityMessageKey =
  | "availability.errors.businessUnavailable"
  | "availability.errors.collaboratorUnavailable"
  | "availability.errors.serviceUnavailable"
  | "availability.slots.noCollaborator"
  | "availability.slots.notConfigured";

/**
 * An error the screen shows instead of the slots: a message of this step
 * (`messageKey`) or a common one shown with ErrorState (`commonMessageKey`).
 */
export interface AvailabilityErrorView {
  readonly action: AvailabilityErrorAction;
  readonly commonMessageKey: Nullable<ErrorMessageKey>;
  readonly messageKey: Nullable<AvailabilityMessageKey>;
}

/**
 * ViewModel of the availability step (KAN-140 to KAN-143).
 * @property errorView - Error shown instead of the slots, or `null`.
 * @property isEmptyDay - The selected day has no free slot (AC-KAN-141-08).
 * @property selectedSlotStartsAt - The chosen slot; cleared when the day changes.
 */
export interface AvailabilityViewModel {
  readonly canContinue: boolean;
  readonly canGoToNextWeek: boolean;
  readonly canGoToPreviousWeek: boolean;
  readonly errorView: Nullable<AvailabilityErrorView>;
  readonly handleBackToServices: () => void;
  readonly handleContinue: () => void;
  readonly handleNextWeek: () => void;
  readonly handlePreviousWeek: () => void;
  readonly handleRetry: () => void;
  readonly handleSelectDate: (date: string) => void;
  readonly handleSelectSlot: (startsAt: string) => void;
  readonly isEmptyDay: boolean;
  readonly isLoading: boolean;
  readonly isLoadingSlots: boolean;
  readonly language: string;
  readonly selectedDate: Nullable<string>;
  readonly selectedSlotStartsAt: string;
  readonly serviceName: string;
  readonly slots: readonly AvailableSlot[];
  readonly timeZone: string;
  readonly weekDays: readonly WeekDay[];
}
