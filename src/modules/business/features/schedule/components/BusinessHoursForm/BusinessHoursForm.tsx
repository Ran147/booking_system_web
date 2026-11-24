import type { ReactElement } from "react";
import { useBusinessHoursViewModel } from "@/modules/business/features/schedule";
import { cn } from "@/utils";
import { BusinessHoursConfirmationCard } from "./BusinessHoursConfirmationCard";
import { BUSINESS_HOURS_FORM_CONFIG } from "./BusinessHoursForm.constants";
import type { BusinessHoursFormProps } from "./BusinessHoursForm.types";
import { BusinessHoursScheduleCard } from "./BusinessHoursScheduleCard";

export const BusinessHoursForm = ({
  className,
}: BusinessHoursFormProps): ReactElement => {
  const {
    confirmationMode,
    confirmationOptions,
    dayRows,
    errorMessage,
    handleConfirmationModeChange,
    handleSaveConfirmationMode,
    handleSaveHours,
    isSaving,
    successMessage,
    timeZone,
  } = useBusinessHoursViewModel();

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        BUSINESS_HOURS_FORM_CONFIG.CONTAINER_MAX_WIDTH_CLASS,
        className,
      )}
    >
      <BusinessHoursScheduleCard
        dayRows={dayRows}
        errorMessage={errorMessage}
        isSaving={isSaving}
        successMessage={successMessage}
        timeZone={timeZone}
        onSave={handleSaveHours}
      />

      <BusinessHoursConfirmationCard
        confirmationMode={confirmationMode}
        confirmationOptions={confirmationOptions}
        isSaving={isSaving}
        onModeChange={handleConfirmationModeChange}
        onSave={handleSaveConfirmationMode}
      />
    </div>
  );
};
