import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, BUTTON_VARIANT } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import {
  COLLABORATOR_SELECTION_MODE,
  type CollaboratorSelectionMode as SelectionModeType,
} from "@/modules/business/features/services";

export interface CollaboratorSelectionModeProps {
  readonly isReadOnly: boolean;
  readonly onSelectMode: (mode: SelectionModeType) => void;
  readonly selectedMode: SelectionModeType;
}

export const CollaboratorSelectionMode = ({
  isReadOnly,
  onSelectMode,
  selectedMode,
}: CollaboratorSelectionModeProps): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.BUSINESS]);

  const isCustomerChoice =
    selectedMode === COLLABORATOR_SELECTION_MODE.CUSTOMER_CHOICE;
  const isAutomatic = selectedMode === COLLABORATOR_SELECTION_MODE.AUTOMATIC;

  return (
    <div
      className="space-y-3 rounded-lg border border-border bg-card p-5"
      data-testid="collaborator-selection-mode-section"
    >
      <div>
        <h3 className="font-semibold text-foreground">
          {t("business:services.collaborators.selection.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("business:services.collaborators.selection.description")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
        <Button
          aria-checked={isCustomerChoice}
          className="h-auto justify-start p-4 text-left font-normal"
          data-testid="mode-customer-choice"
          disabled={isReadOnly}
          onClick={() =>
            onSelectMode(COLLABORATOR_SELECTION_MODE.CUSTOMER_CHOICE)
          }
          role="radio"
          type="button"
          variant={
            isCustomerChoice ? BUTTON_VARIANT.PRIMARY : BUTTON_VARIANT.OUTLINE
          }
        >
          <span className="font-medium">
            {t("business:services.collaborators.selection.customerChoice")}
          </span>
        </Button>

        <Button
          aria-checked={isAutomatic}
          className="h-auto justify-start p-4 text-left font-normal"
          data-testid="mode-automatic"
          disabled={isReadOnly}
          onClick={() => onSelectMode(COLLABORATOR_SELECTION_MODE.AUTOMATIC)}
          role="radio"
          type="button"
          variant={
            isAutomatic ? BUTTON_VARIANT.PRIMARY : BUTTON_VARIANT.OUTLINE
          }
        >
          <span className="font-medium">
            {t("business:services.collaborators.selection.automatic")}
          </span>
        </Button>
      </div>
    </div>
  );
};
