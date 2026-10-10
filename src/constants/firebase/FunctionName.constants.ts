export const FUNCTION_NAME = {
  CANCEL_BOOKING: "cancelBooking",
  CHECK_BUSINESS_SLUG: "checkBusinessSlug",
  COMPLETE_SUBSCRIBER_SIGN_UP: "completeSubscriberSignUp",
  CREATE_BOOKING: "createBooking",
  DELETE_SERVICE: "deleteService",
  EXPORT_COLLECTION: "exportCollection",
  VALIDATE_SIGN_UP_LINK: "validateSignUpLink",
} as const;

export type FunctionName = (typeof FUNCTION_NAME)[keyof typeof FUNCTION_NAME];
