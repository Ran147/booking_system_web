export const FUNCTION_NAME = {
  CANCEL_BOOKING: "cancelBooking",
  CHECK_BUSINESS_SLUG: "checkBusinessSlug",
  COMPLETE_SUBSCRIBER_SIGN_UP: "completeSubscriberSignUp",
  CREATE_BOOKING: "createBooking",
  DELETE_SERVICE: "deleteService",
  EXPORT_COLLECTION: "exportCollection",
  REQUEST_PASSWORD_RESET: "requestPasswordReset",
  VALIDATE_SIGN_UP_LINK: "validateSignUpLink",
  VERIFY_RECAPTCHA: "verifyRecaptcha",
} as const;

export type FunctionName = (typeof FUNCTION_NAME)[keyof typeof FUNCTION_NAME];
