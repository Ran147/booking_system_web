import type { Nullable } from "@/types";
import { fetchAvailability } from "./fetchAvailability";

export interface FirstAvailableDateParams {
  readonly businessId: string;
  readonly collaboratorId: Nullable<string>;
  /** Open days from today to the end of the window, in order. */
  readonly openDays: readonly string[];
  readonly serviceId: string;
  /** Today in the business time zone, used when no day has a slot. */
  readonly today: string;
}

/**
 * AC-KAN-140-07, AS-2: asks the open days one by one and stops at the first
 * with a free slot; with none in the window it falls back to today. Checks
 * the signal before each request, so leaving the page stops the search
 * instead of asking up to the whole window.
 */
export const findFirstAvailableDate = async (
  {
    businessId,
    collaboratorId,
    openDays,
    serviceId,
    today,
  }: FirstAvailableDateParams,
  signal: AbortSignal,
): Promise<string> => {
  for (const date of openDays) {
    signal.throwIfAborted();
    const day = await fetchAvailability({
      businessId,
      collaboratorId,
      date,
      serviceId,
    });
    if (day.slots.length > 0) return date;
  }
  return today;
};
