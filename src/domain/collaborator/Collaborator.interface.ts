import type { Nullable } from "@/types";

import type { CollaboratorPermission } from "./CollaboratorPermission.constants";
import type { CollaboratorStatus } from "./CollaboratorStatus.constants";

export interface Collaborator {
  readonly businessId: string;
  readonly createdAt: string;
  readonly email: string;
  readonly fullName: string;
  readonly id: string;
  readonly lastEmailSentAt: Nullable<string>;
  readonly permissions: readonly CollaboratorPermission[];
  readonly phone: string;
  readonly searchName: string;
  readonly serviceIds: readonly string[];
  readonly specialty: Nullable<string>;
  readonly status: CollaboratorStatus;
  readonly updatedAt: string;
  readonly userId: Nullable<string>;
}
