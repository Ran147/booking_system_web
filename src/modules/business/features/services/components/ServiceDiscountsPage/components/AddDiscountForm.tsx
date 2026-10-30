import { AlertCircle, Plus } from "lucide-react";
import type { FormEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  InputField,
  SelectField,
} from "@/components/common";
import { I18N_NAMESPACE, MONEY } from "@/constants";
import {
  calculateDiscountedPrice,
  DISCOUNT_LIMIT,
  DISCOUNT_TYPE,
  type DiscountFormState,
  type DiscountType,
} from "@/modules/business/features/services";
import type { Nullable } from "@/types";
import { formatPrice } from "@/utils";

export interface AddDiscountFormProps {
  readonly currency?: string;
  readonly formError: Nullable<string>;
  readonly formState: DiscountFormState;
  readonly isPending: boolean;
  readonly isReadOnly: boolean;
  readonly onFormChange: <Key extends keyof DiscountFormState>(
    field: Key,
    value: DiscountFormState[Key],
  ) => void;
  readonly onSubmit: () => Promise<void>;
  readonly servicePriceInCents?: number;
}

export const AddDiscountForm = ({
  currency,
  formError,
  formState,
  isPending,
  isReadOnly,
  onFormChange,
  onSubmit,
  servicePriceInCents,
}: AddDiscountFormProps): ReactElement => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  const numericValue = Number(formState.value);
  const isValidNumber = !Number.isNaN(numericValue) && numericValue > 0;
  let previewDiscountedPriceInCents: Nullable<number> = null;

  if (servicePriceInCents !== undefined && isValidNumber) {
    if (formState.type === DISCOUNT_TYPE.PERCENTAGE) {
      if (numericValue <= DISCOUNT_LIMIT.MAX_PERCENTAGE) {
        previewDiscountedPriceInCents = calculateDiscountedPrice(
          servicePriceInCents,
          {
            endsAt: new Date(),
            startsAt: new Date(),
            type: DISCOUNT_TYPE.PERCENTAGE,
            value: numericValue,
          },
        );
      }
    } else {
      const amountInCents = Math.round(numericValue * MONEY.CENTS_PER_UNIT);
      if (amountInCents < servicePriceInCents) {
        previewDiscountedPriceInCents = calculateDiscountedPrice(
          servicePriceInCents,
          {
            endsAt: new Date(),
            startsAt: new Date(),
            type: DISCOUNT_TYPE.FIXED_AMOUNT,
            value: amountInCents,
          },
        );
      }
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void onSubmit();
  };

  const discountTypeOptions = [
    {
      label: t("services.discounts.typePercentage"),
      value: DISCOUNT_TYPE.PERCENTAGE,
    },
    {
      label: t("services.discounts.typeFixedAmount"),
      value: DISCOUNT_TYPE.FIXED_AMOUNT,
    },
  ];

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground">
          {t("services.discounts.addDiscountAction")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && (
            <div
              aria-live="assertive"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              disabled={isReadOnly || isPending}
              id="discount-type"
              label={t("services.discounts.typeLabel")}
              name="discountType"
              onChange={(event) =>
                onFormChange("type", event.target.value as DiscountType)
              }
              options={discountTypeOptions}
              value={formState.type}
            />

            <InputField
              disabled={isReadOnly || isPending}
              helperText={
                formState.type === DISCOUNT_TYPE.PERCENTAGE
                  ? t("services.discounts.valueHelpPercentage")
                  : t("services.discounts.valueHelpFixed")
              }
              id="discount-value"
              label={t("services.discounts.valueLabel")}
              name="discountValue"
              onChange={(event) =>
                onFormChange(
                  "value",
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
              placeholder={t("services.discounts.valuePlaceholder")}
              step={formState.type === DISCOUNT_TYPE.PERCENTAGE ? "1" : "0.01"}
              type="number"
              value={formState.value}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              disabled={isReadOnly || isPending}
              id="discount-start-date"
              label={t("services.discounts.startDateLabel")}
              name="startDate"
              onChange={(event) => onFormChange("startsAt", event.target.value)}
              type="date"
              value={formState.startsAt}
            />

            <InputField
              disabled={isReadOnly || isPending}
              id="discount-end-date"
              label={t("services.discounts.endDateLabel")}
              name="endDate"
              onChange={(event) => onFormChange("endsAt", event.target.value)}
              type="date"
              value={formState.endsAt}
            />
          </div>

          {previewDiscountedPriceInCents !== null && currency && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <span className="font-medium text-foreground">
                {t("services.discounts.previewPrice", {
                  price: formatPrice(
                    previewDiscountedPriceInCents,
                    currency,
                    i18n.language,
                  ),
                })}
              </span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              ariaLabel={t("services.discounts.addDiscountAction")}
              disabled={isReadOnly || isPending}
              isLoading={isPending}
              leftIcon={Plus}
              size={BUTTON_SIZE.MD}
              type="submit"
              variant={BUTTON_VARIANT.DEFAULT}
            >
              {isPending
                ? t("services.discounts.adding")
                : t("services.discounts.addDiscountAction")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
