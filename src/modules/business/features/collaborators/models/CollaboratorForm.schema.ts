import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { COLLABORATOR_PERMISSION } from "@/domain";
import { fullNameFieldSchema, phoneFieldSchema } from "@/modules/auth";
import { COLLABORATOR_RULE } from "../constants/CollaboratorFeature.constants";

const permissionSchema = z.enum([
  COLLABORATOR_PERMISSION.MANAGE_BOOKINGS,
  COLLABORATOR_PERMISSION.MANAGE_CUSTOMERS,
  COLLABORATOR_PERMISSION.MANAGE_SCHEDULE_BLOCKS,
  COLLABORATOR_PERMISSION.MANAGE_SERVICES,
  COLLABORATOR_PERMISSION.VIEW_REPORTS,
]);

export const collaboratorFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .email(VALIDATION_MESSAGE_KEY.EMAIL_INVALID),
  fullName: fullNameFieldSchema,
  permissions: z.array(permissionSchema),
  phone: phoneFieldSchema,
  serviceIds: z
    .array(z.string().min(1))
    .min(1, "business:collaborators.form.validation.serviceRequired"),
  specialty: z
    .string()
    .trim()
    .max(
      COLLABORATOR_RULE.SPECIALTY_MAX_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    ),
});

export type CollaboratorFormValues = z.infer<typeof collaboratorFormSchema>;
