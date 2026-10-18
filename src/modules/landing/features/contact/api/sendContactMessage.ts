import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type { ContactFormData } from "../models/contactForm.schema";

export interface SendContactMessageResponse {
  readonly success: boolean;
}

export const sendContactMessage = async (
  payload: ContactFormData,
): Promise<SendContactMessageResponse> => {
  await callFunction<{ token: string }, { valid: boolean }>(
    FUNCTION_NAME.VERIFY_RECAPTCHA,
    { token: payload.recaptchaToken },
  );

  return { success: true };
};
