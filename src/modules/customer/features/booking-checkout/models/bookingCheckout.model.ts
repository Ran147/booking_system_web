import type { BookingStatus } from "@/domain";
import type { ErrorMessageKey } from "@/shared/constants";
import type { Nullable } from "@/types";
import type { CheckoutErrorAction } from "../constants/BookingCheckout.constants";

/**
 * Business.bookingPolicy, provisional shape (spec KAN-145, P-1 = A): the
 * glossary names the field but no story defines it yet.
 */
export interface BookingPolicy {
  readonly cancellationWindowHours: number;
  readonly penaltyDescription: string;
}

/** What the summary shows before confirming (KAN-146, KAN-147). */
export interface CheckoutSummary {
  /** Service price without discount; sent back as expectedPriceInCents. */
  readonly basePriceInCents: number;
  readonly businessId: string;
  readonly businessName: string;
  readonly currency: string;
  readonly durationMinutes: number;
  /** Price after an active discount (P-2 = A); equal to the base without one. */
  readonly finalPriceInCents: number;
  /** The service is served by collaborators (it has collaboratorSelection). */
  readonly hasCollaborators: boolean;
  readonly policy: Nullable<BookingPolicy>;
  readonly serviceName: string;
  readonly timeZone: string;
}

export interface CreateCustomerBookingPayload {
  readonly businessId: string;
  readonly collaboratorId?: string;
  readonly expectedDurationMinutes: number;
  readonly expectedPriceInCents: number;
  readonly requestId: string;
  readonly serviceId: string;
  readonly startsAt: string;
}

export interface CreateCustomerBookingResponse {
  readonly bookingId: string;
  readonly status: BookingStatus;
}

/** customer namespace keys of the confirmation errors (C-5). */
export type CheckoutMessageKey =
  | "bookingCheckout.confirm.customerBlockedError"
  | "bookingCheckout.confirm.serviceChangedError"
  | "bookingCheckout.confirm.slotTakenError"
  | "bookingCheckout.confirm.unavailableError";

/** An error shown on the summary: of this step, or common with ErrorState. */
export interface CheckoutErrorView {
  readonly action: CheckoutErrorAction;
  readonly commonMessageKey: Nullable<ErrorMessageKey>;
  readonly messageKey: Nullable<CheckoutMessageKey>;
}

/**
 * ViewModel of the summary and confirm step (KAN-146 to KAN-148).
 * @property canConfirm - Summary loaded, policy acknowledged when there is one, not sending.
 * @property loadErrorKey - The summary could not load (AC-KAN-146-04).
 * @property originalPriceLabel - Price before the discount, or `null` without one.
 */
export interface BookingCheckoutViewModel {
  readonly canConfirm: boolean;
  readonly confirmError: Nullable<CheckoutErrorView>;
  readonly dateLabel: string;
  readonly durationMinutes: number;
  readonly handleAcknowledgePolicy: (isAcknowledged: boolean) => void;
  readonly handleChangeService: () => void;
  readonly handleChangeTime: () => void;
  readonly handleConfirm: () => void;
  readonly handleRetryLoad: () => void;
  readonly isConfirming: boolean;
  readonly isLoading: boolean;
  readonly isPolicyAcknowledged: boolean;
  readonly loadErrorKey: Nullable<ErrorMessageKey>;
  readonly originalPriceLabel: Nullable<string>;
  readonly summary: Nullable<CheckoutSummary>;
  readonly timeLabel: string;
  readonly priceLabel: string;
}
