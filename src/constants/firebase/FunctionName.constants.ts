export const FUNCTION_NAME = {
  CANCEL_BOOKING: "cancelBooking",
  CHECK_BUSINESS_SLUG: "checkBusinessSlug",
  COMPLETE_SUBSCRIBER_SIGN_UP: "completeSubscriberSignUp",
  CREATE_BOOKING: "createBooking",
  CREATE_SERVICE: "createService",
  DELETE_SERVICE: "deleteService",
  EXPORT_COLLECTION: "exportCollection",
  PAY_PLAN_CHECKOUT: "payPlanCheckout",
  REQUEST_PASSWORD_RESET: "requestPasswordReset",
  SEND_CONTACT_MESSAGE: "sendContactMessage",
  UPDATE_SERVICE: "updateService",
  UPDATE_SERVICE_COLLABORATORS: "updateServiceCollaborators",
  VALIDATE_SIGN_UP_LINK: "validateSignUpLink",
  VERIFY_RECAPTCHA: "verifyRecaptcha",
} as const;

export type FunctionName = (typeof FUNCTION_NAME)[keyof typeof FUNCTION_NAME];
