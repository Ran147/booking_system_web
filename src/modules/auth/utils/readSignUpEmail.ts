import type { Nullable } from "@/types";

// location.state is whatever the previous page sent: only a non-empty
// signUpEmail string is used (AC-KAN-27-01).
export const readSignUpEmail = (locationState: unknown): Nullable<string> => {
  if (typeof locationState !== "object" || locationState === null) return null;
  const signUpEmail: unknown = Reflect.get(locationState, "signUpEmail");
  return typeof signUpEmail === "string" && signUpEmail.length > 0
    ? signUpEmail
    : null;
};
