import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { CHANGE_PASSWORD_MESSAGE_KEY, PASSWORD_RULE } from "../constants";

const strongPasswordSchema = z
  .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
  .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
  .min(PASSWORD_RULE.MIN_LENGTH, VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK)
  .refine(
    (password) =>
      Object.values(PASSWORD_RULE.PATTERN).every((pattern) =>
        pattern.test(password),
      ),
    VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK,
  );

export const changePasswordFormSchema = z
  .object({
    confirmation: z
      .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
      .min(1, VALIDATION_MESSAGE_KEY.REQUIRED),
    currentPassword: z
      .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
      .min(1, VALIDATION_MESSAGE_KEY.REQUIRED),
    newPassword: strongPasswordSchema,
  })
  .superRefine((values, context) => {
    if (values.newPassword === values.currentPassword) {
      context.addIssue({
        code: "custom",
        message: CHANGE_PASSWORD_MESSAGE_KEY.SAME_AS_CURRENT,
        path: ["newPassword"],
      });
    }

    if (values.confirmation !== values.newPassword) {
      context.addIssue({
        code: "custom",
        message: CHANGE_PASSWORD_MESSAGE_KEY.MISMATCH,
        path: ["confirmation"],
      });
    }
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
