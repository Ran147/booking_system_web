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
import { COLLABORATOR_STATUS_TONE } from "@/domain";
import type { Nullable } from "@/types";
import { CollaboratorListRowActions } from "./CollaboratorListRowActions";
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
        {items.map((item) => (
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
              {!isReadOnly && (
                <CollaboratorListRowActions
                  isResending={isResendingCollaboratorId === item.id}
                  item={item}
                  onDeactivate={onDeactivate}
                  onEdit={onEdit}
                  onPermissions={onPermissions}
                  onReactivate={onReactivate}
                  onResendEmail={onResendEmail}
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
