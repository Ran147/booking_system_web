import type { z } from "zod";
import type { completeCustomerSignUpPayloadSchema } from "./CompleteCustomerSignUp.schema.js";
import type { VerificationEmailStatus } from "../constants/CustomerSignUp.constants.js";

// Contract of the completeCustomerSignUp callable (KAN-123).
export type CompleteCustomerSignUpPayload = z.input<
  typeof completeCustomerSignUpPayloadSchema
>;

export interface CompleteCustomerSignUpResponse {
  readonly verificationEmail: VerificationEmailStatus;
}

/** Sends the verification email of a new account; true when Firebase took it. */
export type SendVerificationEmail = (
  userId: string,
  language: string,
  continueUrl: string,
) => Promise<boolean>;
