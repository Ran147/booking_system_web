import { AUDIT_LOG_ACTION_TYPE, type AuditLogActionType } from "@/domain";
import type { Nullable } from "@/types";
import { AUDIT_LOG_DATE_PATTERN, AUDIT_LOG_QUERY_PARAM } from "../constants";
import type { AuditLogFilters } from "../models";

export const EMPTY_AUDIT_LOG_FILTERS: AuditLogFilters = Object.freeze({
  actionType: null,
  from: null,
  to: null,
});

const VALID_ACTION_TYPES: readonly string[] = Object.values(
  AUDIT_LOG_ACTION_TYPE,
);

const isValidDateText = (
  rawDate: Nullable<string> | undefined,
): rawDate is string =>
  typeof rawDate === "string" &&
  AUDIT_LOG_DATE_PATTERN.test(rawDate) &&
  !Number.isNaN(Date.parse(rawDate));

export const isAuditLogDateRangeInvalid = (
  from: Nullable<string> | undefined,
  to: Nullable<string> | undefined,
): boolean => typeof from === "string" && typeof to === "string" && from > to;

export const hasActiveAuditLogFilters = (filters: AuditLogFilters): boolean =>
  filters.actionType !== null || filters.from !== null || filters.to !== null;

export const readAuditLogFilters = (
  searchParameters: URLSearchParams,
): {
  filters: AuditLogFilters;
  isUnknownActionTypeInUrl: boolean;
} => {
  const rawFrom = searchParameters.get(AUDIT_LOG_QUERY_PARAM.FROM);
  const rawTo = searchParameters.get(AUDIT_LOG_QUERY_PARAM.TO);
  const rawActionType = searchParameters.get(AUDIT_LOG_QUERY_PARAM.ACTION_TYPE);

  const from = isValidDateText(rawFrom) ? rawFrom : null;
  const to = isValidDateText(rawTo) ? rawTo : null;

  let actionType: Nullable<AuditLogActionType> = null;
  let isUnknownActionTypeInUrl = false;

  if (rawActionType !== null && rawActionType !== "") {
    if (VALID_ACTION_TYPES.includes(rawActionType)) {
      actionType = rawActionType as AuditLogActionType;
    } else {
      isUnknownActionTypeInUrl = true;
    }
  }

  return {
    filters: {
      actionType,
      from,
      to,
    },
    isUnknownActionTypeInUrl,
  };
};

export const buildAuditLogSearchParams = (
  filters: AuditLogFilters,
): URLSearchParams => {
  const searchParameters = new URLSearchParams();

  if (filters.actionType) {
    searchParameters.set(AUDIT_LOG_QUERY_PARAM.ACTION_TYPE, filters.actionType);
  }

  if (filters.from) {
    searchParameters.set(AUDIT_LOG_QUERY_PARAM.FROM, filters.from);
  }

  if (filters.to) {
    searchParameters.set(AUDIT_LOG_QUERY_PARAM.TO, filters.to);
  }

  return searchParameters;
};
