import type { Nullable } from "@/types";
import type { AuditLogActionType } from "./AuditLogActionType.constants";
import type { AuditLogTargetType } from "./AuditLogTargetType.constants";

export interface AuditLogEntry {
  readonly actionType: AuditLogActionType;
  readonly actorEmail: string;
  readonly actorUserId: string;
  readonly after: Nullable<Record<string, unknown>>;
  readonly before: Nullable<Record<string, unknown>>;
  readonly createdAt: Date;
  readonly id: string;
  readonly reason: Nullable<string>;
  readonly targetId: string;
  readonly targetName: string;
  readonly targetType: AuditLogTargetType;
}
