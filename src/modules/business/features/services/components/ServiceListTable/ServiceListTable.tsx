import {
  CheckCircle2,
  Clock,
  Pencil,
  Power,
  PowerOff,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common";
import { I18N_NAMESPACE, TONE } from "@/constants";
import { SERVICE_STATUS } from "@/domain";
import { formatPrice } from "@/utils";
import type { ServiceListTableProps } from "./types/ServiceListTable.types";

export const ServiceListTable = ({
  currency,
  isActivating,
  isReadOnly,
  onActivateService,
  onEditService,
  onNavigateToCollaborators,
  onNavigateToDiscounts,
  onOpenDeactivateModal,
  onOpenDeleteModal,
  services,
}: ServiceListTableProps): ReactElement => {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("services.list.name")}</TableHead>
            <TableHead>{t("services.list.duration")}</TableHead>
            <TableHead>{t("services.list.price")}</TableHead>
            <TableHead>{t("services.list.status")}</TableHead>
            <TableHead className="text-right">
              {t("services.list.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((serviceItem) => {
            const isServiceActive =
              serviceItem.status === SERVICE_STATUS.ACTIVE;

            return (
              <TableRow key={serviceItem.id}>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">
                      {serviceItem.name}
                    </p>
                    {serviceItem.description && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {serviceItem.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t("services.list.durationMinutes", {
                    minutes: serviceItem.durationMinutes,
                  })}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  {formatPrice(
                    serviceItem.priceInCents,
                    currency,
                    i18n.language,
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    tone={isServiceActive ? TONE.SUCCESS : TONE.NEUTRAL}
                  >
                    <span className="flex items-center gap-1">
                      {isServiceActive ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      <span>
                        {isServiceActive
                          ? t("services.list.statusActive")
                          : t("services.list.statusInactive")}
                      </span>
                    </span>
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      ariaLabel={t("services.list.editAction")}
                      disabled={isReadOnly}
                      leftIcon={Pencil}
                      onClick={() => onEditService?.(serviceItem.id)}
                      size={BUTTON_SIZE.SM}
                      type="button"
                      variant={BUTTON_VARIANT.GHOST}
                    >
                      {t("services.list.editAction")}
                    </Button>
                    <Button
                      ariaLabel={t("services.list.discountsAction")}
                      leftIcon={Tag}
                      onClick={() =>
                        onNavigateToDiscounts
                          ? onNavigateToDiscounts(serviceItem.id)
                          : navigate(
                              `/business/services/${serviceItem.id}/discounts`,
                            )
                      }
                      size={BUTTON_SIZE.SM}
                      type="button"
                      variant={BUTTON_VARIANT.GHOST}
                    >
                      {t("services.list.discountsAction")}
                    </Button>
                    <Button
                      ariaLabel={t("services.list.collaboratorsAction")}
                      leftIcon={Users}
                      onClick={() =>
                        onNavigateToCollaborators
                          ? onNavigateToCollaborators(serviceItem.id)
                          : navigate(
                              `/business/services/${serviceItem.id}/collaborators`,
                            )
                      }
                      size={BUTTON_SIZE.SM}
                      type="button"
                      variant={BUTTON_VARIANT.GHOST}
                    >
                      {t("services.list.collaboratorsAction")}
                    </Button>
                    {isServiceActive ? (
                      <Button
                        ariaLabel={t("services.status.deactivateAction")}
                        disabled={isReadOnly}
                        leftIcon={PowerOff}
                        onClick={() => onOpenDeactivateModal?.(serviceItem.id)}
                        size={BUTTON_SIZE.SM}
                        type="button"
                        variant={BUTTON_VARIANT.GHOST}
                      >
                        {t("services.status.deactivateAction")}
                      </Button>
                    ) : (
                      <>
                        <Button
                          ariaLabel={t("services.status.activateAction")}
                          disabled={isReadOnly || isActivating}
                          leftIcon={Power}
                          onClick={() => onActivateService?.(serviceItem.id)}
                          size={BUTTON_SIZE.SM}
                          type="button"
                          variant={BUTTON_VARIANT.GHOST}
                        >
                          {t("services.status.activateAction")}
                        </Button>
                        <Button
                          ariaLabel={t("services.delete.action")}
                          disabled={isReadOnly}
                          leftIcon={Trash2}
                          onClick={() => onOpenDeleteModal?.(serviceItem.id)}
                          size={BUTTON_SIZE.SM}
                          type="button"
                          variant={BUTTON_VARIANT.GHOST}
                        >
                          {t("services.delete.action")}
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
