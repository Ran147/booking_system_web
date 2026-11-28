import { z } from "zod";
import { COLLABORATOR_PERMISSION } from "../../shared/constants/CollaboratorPermission.constants.js";
import { COLLABORATOR_STATUS } from "../../shared/constants/CollaboratorStatus.constants.js";
import { FULL_NAME_RULE } from "../../shared/constants/FullNameRule.constants.js";
import { PASSWORD_RULE } from "../../shared/constants/PasswordRule.constants.js";
import { PHONE_RULE } from "../../shared/constants/PhoneRule.constants.js";
import type { Nullable } from "../../shared/types/Nullable.js";
import { COLLABORATOR_RULE_LIMIT } from "../constants/CollaboratorHandler.constants.js";

const collaboratorPermissionValues = [
  COLLABORATOR_PERMISSION.MANAGE_BOOKINGS,
  COLLABORATOR_PERMISSION.MANAGE_CUSTOMERS,
  COLLABORATOR_PERMISSION.MANAGE_SCHEDULE_BLOCKS,
  COLLABORATOR_PERMISSION.MANAGE_SERVICES,
  COLLABORATOR_PERMISSION.VIEW_REPORTS,
] as const;

export const collaboratorPermissionSchema = z.enum(collaboratorPermissionValues);

export type CollaboratorPermissionValue = z.infer<
  typeof collaboratorPermissionSchema
>;

const phoneSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value.length === 0) {
        return true;
      }
      const digitsCount =
        value.match(PHONE_RULE.PATTERN.DIGIT)?.length ?? 0;
      return (
        value.length <= PHONE_RULE.MAX_LENGTH &&
        PHONE_RULE.PATTERN.ALLOWED_CHARACTERS.test(value) &&
        digitsCount >= PHONE_RULE.MIN_DIGITS &&
        digitsCount <= PHONE_RULE.MAX_DIGITS
      );
    },
    { message: "Invalid phone number" },
  );

const fullNameSchema = z
  .string()
  .trim()
  .min(FULL_NAME_RULE.MIN_LENGTH)
  .max(FULL_NAME_RULE.MAX_LENGTH);

const emailSchema = z.string().trim().toLowerCase().email();

const specialtySchema = z
  .string()
  .trim()
  .max(COLLABORATOR_RULE_LIMIT.SPECIALTY_MAX_LENGTH)
  .nullable()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

export const registerCollaboratorPayloadSchema = z.object({
  businessId: z.string().min(1),
  email: emailSchema,
  fullName: fullNameSchema,
  permissions: z.array(collaboratorPermissionSchema).default([]),
  phone: phoneSchema.optional().default(""),
  serviceIds: z.array(z.string().min(1)).default([]),
  specialty: specialtySchema,
});

export const updateCollaboratorPayloadSchema = z.object({
  businessId: z.string().min(1),
  collaboratorId: z.string().min(1),
  email: emailSchema.optional(),
  expectedUpdatedAt: z.string().optional(),
  fullName: fullNameSchema,
  phone: phoneSchema.optional().default(""),
  serviceIds: z.array(z.string().min(1)).default([]),
  specialty: specialtySchema,
});

export const updateCollaboratorStatusPayloadSchema = z.object({
  businessId: z.string().min(1),
  collaboratorId: z.string().min(1),
  targetStatus: z.enum([
    COLLABORATOR_STATUS.ACTIVE,
    COLLABORATOR_STATUS.INACTIVE,
  ]),
});

export const updateCollaboratorPermissionsPayloadSchema = z.object({
  businessId: z.string().min(1),
  collaboratorId: z.string().min(1),
  permissions: z.array(collaboratorPermissionSchema),
});

export const resendCollaboratorEmailPayloadSchema = z.object({
  businessId: z.string().min(1),
  collaboratorId: z.string().min(1),
});

export const validateCollaboratorInvitationPayloadSchema = z.object({
  invitationToken: z.string().trim().min(1),
});

const strongPasswordSchema = z
  .string()
  .min(PASSWORD_RULE.MIN_LENGTH)
  .refine((value) => PASSWORD_RULE.PATTERN.LOWERCASE.test(value))
  .refine((value) => PASSWORD_RULE.PATTERN.UPPERCASE.test(value))
  .refine((value) => PASSWORD_RULE.PATTERN.DIGIT.test(value))
  .refine((value) => PASSWORD_RULE.PATTERN.SYMBOL.test(value));

export const acceptCollaboratorInvitationPayloadSchema = z.object({
  invitationToken: z.string().trim().min(1),
  password: strongPasswordSchema,
  recaptchaToken: z.string().optional().default(""),
});

export interface RegisterCollaboratorResult {
  readonly collaboratorId: string;
  readonly email: string;
  readonly invitationToken: string;
  readonly status: string;
}

export interface UpdateCollaboratorResult {
  readonly collaboratorId: string;
  readonly emailChanged: boolean;
  readonly invitationToken?: Nullable<string>;
  readonly upcomingAffectedBookingsCount: number;
}

export interface UpdateCollaboratorStatusResult {
  readonly collaboratorId: string;
  readonly status: string;
}

export interface UpdateCollaboratorPermissionsResult {
  readonly collaboratorId: string;
  readonly permissions: readonly CollaboratorPermissionValue[];
}

export interface ResendCollaboratorEmailResult {
  readonly collaboratorId: string;
  readonly invitationToken?: Nullable<string>;
  readonly kind: string;
}

export interface ValidateCollaboratorInvitationResult {
  readonly businessName: string;
  readonly email: string;
}

export interface AcceptCollaboratorInvitationResult {
  readonly email: string;
}
