export const HTTP_STATUS = Object.freeze({
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  METHOD_NOT_ALLOWED: 405,
  NOT_FOUND: 404,
  OK: 200,
  PRECONDITION_FAILED: 412,
} as const);

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
