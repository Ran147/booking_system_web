import type { QueryDocumentSnapshot } from "firebase/firestore";
import { z } from "zod";
import {
  COLLABORATOR_PERMISSION,
  COLLABORATOR_STATUS,
  type CollaboratorPermission,
} from "@/domain";
import type { Nullable } from "@/types";
import { COLLABORATOR_RULE } from "../constants/CollaboratorFeature.constants";
import type { ActiveServiceOption, CollaboratorListItem } from "../models";

const collaboratorPermissionSchema = z.enum([
  COLLABORATOR_PERMISSION.MANAGE_BOOKINGS,
  COLLABORATOR_PERMISSION.MANAGE_CUSTOMERS,
  COLLABORATOR_PERMISSION.MANAGE_SCHEDULE_BLOCKS,
  COLLABORATOR_PERMISSION.MANAGE_SERVICES,
  COLLABORATOR_PERMISSION.VIEW_REPORTS,
]);

const collaboratorStatusSchema = z.enum([
  COLLABORATOR_STATUS.ACTIVE,
  COLLABORATOR_STATUS.INACTIVE,
  COLLABORATOR_STATUS.INVITED,
]);

export const parseIsoTimestamp = (value: unknown): Nullable<string> => {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === "object") {
    const candidate = value as {
      seconds?: unknown;
      toDate?: () => Date;
    };
    if (typeof candidate.toDate === "function") {
      return candidate.toDate().toISOString();
    }
    if (typeof candidate.seconds === "number") {
      return new Date(
        candidate.seconds * COLLABORATOR_RULE.MILLISECONDS_PER_SECOND,
      ).toISOString();
    }
  }
  return null;
};

const normalizePermissions = (
  rawPermissions: unknown,
): readonly CollaboratorPermission[] => {
  if (Array.isArray(rawPermissions)) {
    return rawPermissions
      .map((item) => collaboratorPermissionSchema.safeParse(item))
      .filter((parsed) => parsed.success)
      .map((parsed) => parsed.data);
  }
  return [];
};

export const collaboratorDocumentSchema = z.object({
  businessId: z.string().optional().default(""),
  email: z.string().optional().default(""),
  fullName: z.string().optional().default(""),
  is_owner: z.boolean().optional().default(false),
  lastEmailSentAt: z.unknown().optional(),
  permissions: z.unknown().optional(),
  phone: z.string().optional().default(""),
  serviceIds: z.array(z.string()).optional().default([]),
  specialty: z.string().nullable().optional().default(null),
  status: collaboratorStatusSchema
    .optional()
    .default(COLLABORATOR_STATUS.INVITED),
  updatedAt: z.unknown().optional(),
  userId: z.string().nullable().optional().default(null),
});

export type CollaboratorDocumentData = z.infer<
  typeof collaboratorDocumentSchema
>;

export const mapCollaboratorListItem = (
  documentSnapshot: QueryDocumentSnapshot,
): CollaboratorListItem => {
  const parsed = collaboratorDocumentSchema.parse(
    documentSnapshot.data() ?? {},
  );
  return {
    email: parsed.email,
    fullName: parsed.fullName,
    id: documentSnapshot.id,
    lastEmailSentAt: parseIsoTimestamp(parsed.lastEmailSentAt),
    permissions: normalizePermissions(parsed.permissions),
    phone: parsed.phone,
    serviceIds: parsed.serviceIds,
    specialty: parsed.specialty ?? null,
    status: parsed.status,
  };
};

export const activeServiceDocumentSchema = z.object({
  name: z.string().optional().default(""),
  status: z.string().optional(),
});

export const mapActiveServiceOption = (
  documentSnapshot: QueryDocumentSnapshot,
): ActiveServiceOption => {
  const parsed = activeServiceDocumentSchema.parse(
    documentSnapshot.data() ?? {},
  );
  return {
    id: documentSnapshot.id,
    name: parsed.name,
  };
};
