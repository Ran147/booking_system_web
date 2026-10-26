import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type { ContactFormData } from "../models/contactForm.schema";

export interface SendContactMessageResponse {
  readonly success: boolean;
}

export const sendContactMessage = async (
  payload: ContactFormData,
): Promise<SendContactMessageResponse> => {
  await callFunction<ContactFormData, { isSent: boolean }>(
    FUNCTION_NAME.SEND_CONTACT_MESSAGE,
    payload,
  );

  return { success: true };
};
