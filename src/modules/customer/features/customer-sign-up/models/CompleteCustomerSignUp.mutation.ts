import type { Language } from "@/constants";
import type { VerificationEmailStatus } from "../constants/CustomerSignUp.constants";

/**
 * Contrato del callable completeCustomerSignUp (functions/src/auth, KAN-123).
 * @property {string} continueUrl - Página del negocio a la que se vuelve después de iniciar sesión.
 */
export interface CompleteCustomerSignUpPayload {
  readonly continueUrl: string;
  readonly email: string;
  readonly fullName: string;
  readonly language: Language;
  readonly password: string;
  readonly phone: string;
  readonly recaptchaToken: string;
}

/**
 * @property {VerificationEmailStatus} verificationEmail - "sent" también para un correo que ya tenía cuenta (AS-4).
 */
export interface CompleteCustomerSignUpResponse {
  readonly verificationEmail: VerificationEmailStatus;
}
