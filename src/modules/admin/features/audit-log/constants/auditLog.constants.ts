import { PAGINATION } from "@/constants/numbers/Pagination.constants";

export const AUDIT_LOG_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

export const AUDIT_LOG_QUERY_PARAM = Object.freeze({
  ACTION_TYPE: "actionType",
  FROM: "from",
  TO: "to",
});

export const AUDIT_LOG_TIME = Object.freeze({
  MS_PER_DAY: 86_400_000,
  MS_PER_SECOND: 1000,
  ONE_MS: 1,
});
