import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { CheckboxField } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { CollaboratorPermission } from "@/domain";
import { COLLABORATOR_PERMISSION_ITEMS } from "../constants/CollaboratorFeature.constants";

interface CollaboratorPermissionsCheckboxesProps {
  readonly disabled?: boolean;
  readonly onToggle: (permission: CollaboratorPermission) => void;
  readonly selectedPermissions: readonly CollaboratorPermission[];
}

export const CollaboratorPermissionsCheckboxes = ({
  disabled = false,
  onToggle,
  selectedPermissions,
}: CollaboratorPermissionsCheckboxesProps): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.BUSINESS]);

  return (
    <div className="flex flex-col gap-3">
      {COLLABORATOR_PERMISSION_ITEMS.map((permission) => (
        <CheckboxField
          checked={selectedPermissions.includes(permission)}
          disabled={disabled}
          helperText={t(
            `business:collaborators.permissions.items.${permission}.description`,
          )}
          key={permission}
          label={t(
            `business:collaborators.permissions.items.${permission}.label`,
          )}
          name={`permission-${permission}`}
          onChange={(): void => {
            onToggle(permission);
          }}
        />
      ))}
    </div>
  );
};
