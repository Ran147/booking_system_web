import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { Badge, BADGE_VARIANT, type BadgeVariant } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { SUPPORT_TICKET_STATUS, type SupportTicketStatus } from "@/domain";
import type { SupportTicketStatusBadgeProps } from "./SupportTicketStatusBadge.types";

const STATUS_VARIANT_MAP: Record<SupportTicketStatus, BadgeVariant> =
  Object.freeze({
    [SUPPORT_TICKET_STATUS.IN_PROGRESS]: BADGE_VARIANT.WARNING,
    [SUPPORT_TICKET_STATUS.OPEN]: BADGE_VARIANT.PRIMARY,
    [SUPPORT_TICKET_STATUS.RESOLVED]: BADGE_VARIANT.SUCCESS,
  });

export const SupportTicketStatusBadge = ({
  className,
  status,
}: SupportTicketStatusBadgeProps): JSX.Element => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  const variant = STATUS_VARIANT_MAP[status] ?? BADGE_VARIANT.MUTED;
  const label = t(`support.status.${status}`);

  return (
    <Badge className={className} variant={variant}>
      {label}
    </Badge>
  );
};
