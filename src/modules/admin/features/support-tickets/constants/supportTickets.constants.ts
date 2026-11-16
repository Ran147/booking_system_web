import { PAGINATION } from "@/constants/numbers/Pagination.constants";
import { TONE } from "@/constants/theme/Tone.constants";
import { SUPPORT_TICKET_STATUS } from "@/domain";

export const SUPPORT_TICKET_DEFAULT_PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;

export const SUPPORT_TICKET_FIELD = Object.freeze({
  BUSINESS_ID: "businessId",
  BUSINESS_NAME: "businessName",
  CREATED_AT: "createdAt",
  CREATED_BY_USER_ID: "createdByUserId",
  MESSAGE: "message",
  OWNER_EMAIL: "ownerEmail",
  REPLIES: "replies",
  RESOLVED_AT: "resolvedAt",
  STATUS: "status",
  SUBJECT: "subject",
  UPDATED_AT: "updatedAt",
});

export const SUPPORT_TICKET_MAX_REPLY_LENGTH = 5000;

export const SUPPORT_TICKET_MIN_REPLY_LENGTH = 1;

export const SUPPORT_TICKET_QUERY_PARAM = Object.freeze({
  STATUS: "status",
});

export const SUPPORT_TICKET_STATUS_TONE = Object.freeze({
  [SUPPORT_TICKET_STATUS.IN_PROGRESS]: TONE.WARNING,
  [SUPPORT_TICKET_STATUS.OPEN]: TONE.NEUTRAL,
  [SUPPORT_TICKET_STATUS.RESOLVED]: TONE.SUCCESS,
});
