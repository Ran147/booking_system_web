export const HTTP_METHOD = Object.freeze({
  DELETE: "DELETE",
  GET: "GET",
  PATCH: "PATCH",
  POST: "POST",
  PUT: "PUT",
} as const);

export type HttpMethod = (typeof HTTP_METHOD)[keyof typeof HTTP_METHOD];
