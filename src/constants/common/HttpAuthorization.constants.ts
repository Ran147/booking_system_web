// The ID token header the Vercel backend reads (api/callFunction.ts).
export const HTTP_AUTHORIZATION = Object.freeze({
  BEARER_PREFIX: "Bearer ",
  HEADER: "Authorization",
} as const);
