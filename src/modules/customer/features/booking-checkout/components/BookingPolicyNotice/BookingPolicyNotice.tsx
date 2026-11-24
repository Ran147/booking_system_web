import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { CheckboxField } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { BookingCheckoutViewModel } from "@/modules/customer/features/booking-checkout";

export interface BookingPolicyNoticeProps {
  readonly viewModel: BookingCheckoutViewModel;
}

/**
 * The business booking policy (KAN-147). With a policy the customer must
 * acknowledge it before confirming (AC-KAN-147-01, 02); without one, a note
 * and no acknowledgement (AC-KAN-147-03).
 */
export const BookingPolicyNotice = ({
  viewModel,
}: BookingPolicyNoticeProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const policy = viewModel.summary?.policy ?? null;

  return (
    <section
      aria-label={t("bookingCheckout.policies.title")}
      className="flex flex-col gap-3 rounded-lg border border-border p-4"
    >
      <h2 className="font-semibold text-foreground">
        {t("bookingCheckout.policies.title")}
      </h2>
      {policy ? (
        <>
          <p className="text-sm text-foreground">
            {t("bookingCheckout.policies.window", {
              hours: policy.cancellationWindowHours,
            })}
          </p>
          <p className="text-sm text-foreground">
            {t("bookingCheckout.policies.penalty", {
              penalty: policy.penaltyDescription,
            })}
          </p>
          <CheckboxField
            checked={viewModel.isPolicyAcknowledged}
            label={t("bookingCheckout.policies.acknowledge")}
            name="policyAcknowledged"
            onChange={(event) =>
              viewModel.handleAcknowledgePolicy(event.target.checked)
            }
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("bookingCheckout.policies.noPolicyEmpty")}
        </p>
      )}
    </section>
  );
};
