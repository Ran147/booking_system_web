// Cloud Functions entry point. Each domain folder (audit, auth, billing,
// bookings, exports, notifications) exports its functions from here as its
// spec is implemented.
export { verifyRecaptcha } from "./auth/verifyRecaptcha.js";
