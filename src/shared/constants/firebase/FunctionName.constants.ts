export const FUNCTION_NAME = {
  CANCEL_BOOKING: "cancelBooking",
  CREATE_BOOKING: "createBooking",
  DELETE_SERVICE: "deleteService",
  EXPORT_COLLECTION: "exportCollection",
} as const;

export type FunctionName = (typeof FUNCTION_NAME)[keyof typeof FUNCTION_NAME];
