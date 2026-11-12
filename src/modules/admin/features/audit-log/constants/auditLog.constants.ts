import { PAGINATION } from "@/constants/numbers/Pagination.constants";

export const AUDIT_LOG_DEFAULT_PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;

export const AUDIT_LOG_FIELD = Object.freeze({
  ACTION_TYPE: "actionType",
  ACTOR_EMAIL: "actorEmail",
  ACTOR_USER_ID: "actorUserId",
  AFTER: "after",
  BEFORE: "before",
  CREATED_AT: "createdAt",
  REASON: "reason",
  TARGET_ID: "targetId",
  TARGET_NAME: "targetName",
  TARGET_TYPE: "targetType",
});

export const AUDIT_LOG_INDENT = Object.freeze({
  JSON_SPACES: 2,
});
