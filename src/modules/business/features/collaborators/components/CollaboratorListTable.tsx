import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
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
import { I18N_NAMESPACE } from "@/constants";
import { COLLABORATOR_STATUS, COLLABORATOR_STATUS_TONE } from "@/domain";
import type { Nullable } from "@/types";
import type { CollaboratorListItem } from "../models";

interface CollaboratorListTableProps {
  readonly isReadOnly: boolean;
  readonly isResendingCollaboratorId: Nullable<string>;
  readonly items: readonly CollaboratorListItem[];
  readonly onDeactivate: (collaborator: CollaboratorListItem) => void;
  readonly onEdit: (collaboratorId: string) => void;
  readonly onPermissions: (collaboratorId: string) => void;
  readonly onReactivate: (collaborator: CollaboratorListItem) => void;
  readonly onResendEmail: (collaborator: CollaboratorListItem) => void;
  readonly onViewDetail: (collaboratorId: string) => void;
}

export const CollaboratorListTable = ({
  isReadOnly,
  isResendingCollaboratorId,
  items,
  onDeactivate,
  onEdit,
  onPermissions,
  onReactivate,
  onResendEmail,
  onViewDetail,
}: CollaboratorListTableProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            {t("business:collaborators.list.tableColumns.name")}
          </TableHead>
          <TableHead>
            {t("business:collaborators.list.tableColumns.email")}
          </TableHead>
          <TableHead>
            {t("business:collaborators.list.tableColumns.specialty")}
          </TableHead>
          <TableHead>
            {t("business:collaborators.list.tableColumns.servicesCount")}
          </TableHead>
          <TableHead>
            {t("business:collaborators.list.tableColumns.status")}
          </TableHead>
          <TableHead className="text-right">
            {t("business:collaborators.list.tableColumns.actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const isResending = isResendingCollaboratorId === item.id;
          const isActive = item.status === COLLABORATOR_STATUS.ACTIVE;
          const isInactive = item.status === COLLABORATOR_STATUS.INACTIVE;
          const isInvited = item.status === COLLABORATOR_STATUS.INVITED;

          return (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <Button
                  onClick={(): void => {
                    onViewDetail(item.id);
                  }}
                  size={BUTTON_SIZE.SM}
                  type="button"
                  variant={BUTTON_VARIANT.LINK}
                >
                  {item.fullName}
                </Button>
              </TableCell>
              <TableCell>{item.email}</TableCell>
              <TableCell>
                {item.specialty ??
                  t("business:collaborators.profile.noSpecialty")}
              </TableCell>
              <TableCell>{item.serviceIds.length}</TableCell>
              <TableCell>
                <StatusBadge tone={COLLABORATOR_STATUS_TONE[item.status]}>
                  {t(`common:collaboratorStatus.${item.status}`)}
                </StatusBadge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  {!isReadOnly && (
                    <>
                      <Button
                        onClick={(): void => {
                          onEdit(item.id);
                        }}
                        size={BUTTON_SIZE.SM}
                        type="button"
                        variant={BUTTON_VARIANT.OUTLINE}
                      >
                        {t("business:collaborators.profile.editAction")}
                      </Button>
                      <Button
                        onClick={(): void => {
                          onPermissions(item.id);
                        }}
                        size={BUTTON_SIZE.SM}
                        type="button"
                        variant={BUTTON_VARIANT.OUTLINE}
                      >
                        {t("business:collaborators.permissions.action")}
                      </Button>
                      {(isInvited || isActive) && (
                        <Button
                          isLoading={isResending}
                          onClick={(): void => {
                            onResendEmail(item);
                          }}
                          size={BUTTON_SIZE.SM}
                          type="button"
                          variant={BUTTON_VARIANT.SECONDARY}
                        >
                          {isInvited
                            ? t("business:collaborators.resend.invitedAction")
                            : t("business:collaborators.resend.activeAction")}
                        </Button>
                      )}
                      {isActive && (
                        <Button
                          onClick={(): void => {
                            onDeactivate(item);
                          }}
                          size={BUTTON_SIZE.SM}
                          type="button"
                          variant={BUTTON_VARIANT.DESTRUCTIVE}
                        >
                          {t("business:collaborators.deactivate.action")}
                        </Button>
                      )}
                      {isInactive && (
                        <Button
                          onClick={(): void => {
                            onReactivate(item);
                          }}
                          size={BUTTON_SIZE.SM}
                          type="button"
                          variant={BUTTON_VARIANT.SECONDARY}
                        >
                          {t("business:collaborators.reactivate.action")}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
