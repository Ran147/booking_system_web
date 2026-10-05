import { STRING } from "@/constants";
import type { SignInFormValues } from "../models/SignInForm.schema";

export const DEFAULT_SIGN_IN_FORM_VALUES = Object.freeze({
  email: STRING.EMPTY,
  password: STRING.EMPTY,
} as const satisfies SignInFormValues);
