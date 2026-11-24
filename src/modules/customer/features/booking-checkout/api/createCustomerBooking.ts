import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type {
  CreateCustomerBookingPayload,
  CreateCustomerBookingResponse,
} from "../models/bookingCheckout.model";

// The server re-checks the slot, assigns who serves it and writes the
// booking in one transaction (KAN-144, KAN-148). Errors are raw here; the
// ViewModel maps them.
export const createCustomerBooking = (
  payload: CreateCustomerBookingPayload,
): Promise<CreateCustomerBookingResponse> =>
  callFunction<CreateCustomerBookingPayload, CreateCustomerBookingResponse>(
    FUNCTION_NAME.CREATE_BOOKING,
    payload,
  );
