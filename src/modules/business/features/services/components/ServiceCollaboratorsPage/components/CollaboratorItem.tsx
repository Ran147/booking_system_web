import { Check } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Badge,
  BADGE_VARIANT,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { COLLABORATOR_STATUS } from "@/domain";
import type { ServiceCollaboratorItem } from "@/modules/business/features/services";

export interface CollaboratorItemProps {
  readonly collaborator: ServiceCollaboratorItem;
  readonly isChecked: boolean;
  readonly isReadOnly: boolean;
  readonly onToggle: (id: string) => void;
  readonly warningCount?: number;
}

export const CollaboratorItem = ({
  collaborator,
  isChecked,
  isReadOnly,
  onToggle,
  warningCount,
}: CollaboratorItemProps): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.BUSINESS]);

  const handleToggle = (): void => {
    if (!isReadOnly) {
      onToggle(collaborator.id);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isChecked
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card hover:bg-muted/40"
      }`}
      data-testid={`collaborator-row-${collaborator.id}`}
    >
      <div className="flex items-start gap-3">
        <Button
          aria-checked={isChecked}
          ariaLabel={collaborator.fullName}
          className="mt-0.5 h-6 w-6 p-0"
          disabled={isReadOnly}
          onClick={handleToggle}
          role="checkbox"
          size={BUTTON_SIZE.SM}
          type="button"
          variant={isChecked ? BUTTON_VARIANT.PRIMARY : BUTTON_VARIANT.OUTLINE}
        >
          {isChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">
              {collaborator.fullName}
            </span>
            <Badge
              variant={
                collaborator.status === COLLABORATOR_STATUS.ACTIVE
                  ? BADGE_VARIANT.SUCCESS
                  : BADGE_VARIANT.WARNING
              }
            >
              {collaborator.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{collaborator.email}</p>

          {warningCount !== undefined && warningCount > 0 && (
            <div
              className="mt-2.5"
              data-testid={`warning-collaborator-${collaborator.id}`}
            >
              <Alert variant={ALERT_VARIANT.WARNING}>
                {t("collaborators.edit.serviceHasBookingsWarning", {
                  count: warningCount,
                })}
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
