import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { passwordFieldSchema } from "@/modules/auth";
import { CHANGE_PASSWORD_ERROR_KEY } from "../constants/ChangePassword.constants";

export const changePasswordFormSchema = z
  .object({
    confirmPassword: z.string().min(1, VALIDATION_MESSAGE_KEY.REQUIRED),
    currentPassword: z.string().min(1, VALIDATION_MESSAGE_KEY.REQUIRED),
    newPassword: passwordFieldSchema,
  })
  .superRefine((formValues, refinementContext) => {
    if (formValues.newPassword === formValues.currentPassword) {
      refinementContext.addIssue({
        code: "custom",
        message: CHANGE_PASSWORD_ERROR_KEY.SAME_AS_CURRENT,
        path: ["newPassword"],
      });
    }

    if (formValues.confirmPassword !== formValues.newPassword) {
      refinementContext.addIssue({
        code: "custom",
        message: CHANGE_PASSWORD_ERROR_KEY.CONFIRMATION_MISMATCH,
        path: ["confirmPassword"],
      });
    }
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
