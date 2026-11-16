import { ROUTE_PATH, SEARCH_PARAM } from "@/constants";

export const buildCollaboratorInvitationUrl = (
  invitationToken: string,
): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${ROUTE_PATH.AUTH.ACCEPT_INVITATION}?${SEARCH_PARAM.TOKEN}=${encodeURIComponent(invitationToken)}`;
};
