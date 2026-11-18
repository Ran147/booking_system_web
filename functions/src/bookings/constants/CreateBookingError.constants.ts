export const CREATE_BOOKING_ERROR = Object.freeze({
  CUSTOMER_BLOCKED: "customer:bookingCheckout.confirm.customerBlockedError",
  INVALID_PAYLOAD: "invalid_payload",
  PERMISSION_DENIED: "permission_denied",
  REQUEST_ID_TAKEN: "request_id_taken",
  SERVICE_CHANGED: "customer:bookingCheckout.confirm.serviceChangedError",
  SERVICE_UNAVAILABLE: "business:services.snapshot.serviceUnavailableError",
  SLOT_TAKEN: "customer:bookingCheckout.confirm.slotTakenError",
  UNAUTHENTICATED: "unauthenticated",
});

export const CREATE_BOOKING_ERROR_REASON = Object.freeze({
  CUSTOMER_BLOCKED: "customer_blocked",
  SERVICE_CHANGED: "service_changed",
  SERVICE_UNAVAILABLE: "service_unavailable",
  SLOT_TAKEN: "slot_taken",
});
