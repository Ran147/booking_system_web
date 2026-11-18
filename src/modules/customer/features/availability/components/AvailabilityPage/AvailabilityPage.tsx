import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  EmptyState,
  ErrorState,
  PageTemplate,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import {
  AVAILABILITY_ERROR_ACTION,
  useAvailabilityViewModel,
} from "@/modules/customer/features/availability";
import { DateStrip } from "../DateStrip/DateStrip";
import { SlotList } from "../SlotList/SlotList";

/** Pick a date and a free slot of the chosen service (KAN-140 to KAN-143). */
export const AvailabilityPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useAvailabilityViewModel();
  const { errorView } = viewModel;

  return (
    <PageTemplate
      description={t("availability.subtitle", {
        service: viewModel.serviceName,
      })}
      title={t("availability.title")}
    >
      {viewModel.isLoading ? <Spinner /> : null}

      {!viewModel.isLoading && errorView ? (
        <div className="flex flex-col items-start gap-3">
          {errorView.commonMessageKey ? (
            <ErrorState messageKey={errorView.commonMessageKey} />
          ) : null}
          {errorView.messageKey ? (
            <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>
              {t(errorView.messageKey)}
            </Alert>
          ) : null}
          {errorView.action === AVAILABILITY_ERROR_ACTION.RETRY ? (
            <Button onClick={viewModel.handleRetry} variant="outline">
              {t("availability.retryAction")}
            </Button>
          ) : null}
          {errorView.action === AVAILABILITY_ERROR_ACTION.BACK_TO_SERVICES ? (
            <Button onClick={viewModel.handleBackToServices} variant="outline">
              {t("availability.backToServices")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {!viewModel.isLoading && !errorView ? (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-muted-foreground">
            {t("availability.timeZoneNote", { timeZone: viewModel.timeZone })}
          </p>
          <DateStrip
            canGoToNextWeek={viewModel.canGoToNextWeek}
            canGoToPreviousWeek={viewModel.canGoToPreviousWeek}
            language={viewModel.language}
            onNextWeek={viewModel.handleNextWeek}
            onPreviousWeek={viewModel.handlePreviousWeek}
            onSelectDate={viewModel.handleSelectDate}
            selectedDate={viewModel.selectedDate}
            weekDays={viewModel.weekDays}
          />
          {viewModel.isLoadingSlots ? <Spinner /> : null}
          {!viewModel.isLoadingSlots && viewModel.isEmptyDay ? (
            <EmptyState message={t("availability.slots.emptyDay")} />
          ) : null}
          {!viewModel.isLoadingSlots && viewModel.slots.length > 0 ? (
            <SlotList
              language={viewModel.language}
              onSelectSlot={viewModel.handleSelectSlot}
              selectedSlotStartsAt={viewModel.selectedSlotStartsAt}
              slots={viewModel.slots}
              timeZone={viewModel.timeZone}
            />
          ) : null}
          <div className="flex justify-end">
            <Button
              disabled={!viewModel.canContinue}
              onClick={viewModel.handleContinue}
            >
              {t("availability.continueAction")}
            </Button>
          </div>
        </div>
      ) : null}
    </PageTemplate>
  );
};
