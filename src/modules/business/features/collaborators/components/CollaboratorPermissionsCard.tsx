import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, BUTTON_VARIANT, Card, CardContent } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { CollaboratorPermission } from "@/domain";
import { CollaboratorPermissionsCheckboxes } from "./CollaboratorPermissionsCheckboxes";

interface CollaboratorPermissionsCardProps {
  readonly isReadOnly: boolean;
  readonly isSaving: boolean;
  readonly onCancel: () => void;
  readonly onSave: () => void;
  readonly onToggle: (permission: CollaboratorPermission) => void;
  readonly selectedPermissions: readonly CollaboratorPermission[];
}

export const CollaboratorPermissionsCard = ({
  isReadOnly,
  isSaving,
  onCancel,
  onSave,
  onToggle,
  selectedPermissions,
}: CollaboratorPermissionsCardProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 pt-6">
        <p className="text-sm text-muted-foreground">
          {t("business:collaborators.permissions.noPermissionsNote")}
        </p>

        <CollaboratorPermissionsCheckboxes
          disabled={isReadOnly || isSaving}
          onToggle={onToggle}
          selectedPermissions={selectedPermissions}
        />

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            disabled={isSaving}
            onClick={onCancel}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {t("common:actions.cancel")}
          </Button>
          {!isReadOnly && (
            <Button isLoading={isSaving} onClick={onSave} type="button">
              {isSaving
                ? t("business:collaborators.permissions.savingLabel")
                : t("business:collaborators.permissions.saveAction")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
