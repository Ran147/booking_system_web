import type { UserRole } from "@/shared/domain";
import type { Nullable } from "@/shared/types";
import type { SESSION_STATUS } from "../constants/SessionStatus.constants";

export interface SignedInSession {
  businessId: Nullable<string>;
  role: UserRole;
  status: typeof SESSION_STATUS.SIGNED_IN;
  userId: string;
}

export type Session =
  | { status: typeof SESSION_STATUS.LOADING }
  | { status: typeof SESSION_STATUS.SIGNED_OUT }
  | SignedInSession;
