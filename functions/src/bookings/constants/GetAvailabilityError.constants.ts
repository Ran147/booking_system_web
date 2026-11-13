// Message keys of the availability step (customer availability spec). The
// client shows the key it receives; `reason` lets it pick the right action.
export const GET_AVAILABILITY_ERROR = Object.freeze({
  BUSINESS_UNAVAILABLE: "customer:availability.errors.businessUnavailable",
  COLLABORATOR_UNAVAILABLE:
    "customer:availability.errors.collaboratorUnavailable",
  INVALID_PAYLOAD: "invalid_payload",
  NO_COLLABORATOR: "customer:availability.slots.noCollaborator",
  NOT_CONFIGURED: "customer:availability.slots.notConfigured",
  PERMISSION_DENIED: "permission_denied",
  SERVICE_UNAVAILABLE: "customer:availability.errors.serviceUnavailable",
  UNAUTHENTICATED: "unauthenticated",
});

export const GET_AVAILABILITY_ERROR_REASON = Object.freeze({
  BUSINESS_UNAVAILABLE: "business_unavailable",
  COLLABORATOR_UNAVAILABLE: "collaborator_unavailable",
  DATE_OUT_OF_WINDOW: "date_out_of_window",
  NO_COLLABORATOR: "no_collaborator",
  NOT_CONFIGURED: "not_configured",
  SERVICE_UNAVAILABLE: "service_unavailable",
});
