import { Trash2 } from "lucide-react";
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
import { I18N_NAMESPACE, TONE } from "@/constants";
import type { ServiceDiscount } from "@/domain";
import {
  DISCOUNT_STATUS,
  DISCOUNT_TYPE,
  getDiscountStatus,
} from "@/modules/business/features/services";
import { formatPrice } from "@/utils";

export interface DiscountsTableProps {
  readonly currency: string;
  readonly discounts: readonly ServiceDiscount[];
  readonly isReadOnly: boolean;
  readonly onRemoveDiscount: (index: number) => void;
  readonly timeZone: string;
}

export const DiscountsTable = ({
  currency,
  discounts,
  isReadOnly,
  onRemoveDiscount,
  timeZone,
}: DiscountsTableProps): ReactElement => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "medium",
      timeZone,
    }).format(date);
  };

  const getStatusBadge = (
    discount: ServiceDiscount,
  ): { label: string; tone: (typeof TONE)[keyof typeof TONE] } => {
    const status = getDiscountStatus(discount, new Date(), timeZone);
    if (status === DISCOUNT_STATUS.EXPIRED) {
      return {
        label: t("services.discounts.expiredBadge"),
        tone: TONE.NEUTRAL,
      };
    }
    if (status === DISCOUNT_STATUS.UPCOMING) {
      return {
        label: t("services.discounts.upcomingBadge"),
        tone: TONE.WARNING,
      };
    }
    return {
      label: t("services.discounts.activeBadge"),
      tone: TONE.SUCCESS,
    };
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("services.discounts.typeLabel")}</TableHead>
            <TableHead>{t("services.discounts.valueLabel")}</TableHead>
            <TableHead>{t("services.discounts.startDateLabel")}</TableHead>
            <TableHead>{t("services.discounts.endDateLabel")}</TableHead>
            <TableHead>{t("services.list.status")}</TableHead>
            <TableHead className="w-16">
              <span className="sr-only">{t("services.list.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {discounts.map((discount, index) => {
            const badge = getStatusBadge(discount);
            const formattedValue =
              discount.type === DISCOUNT_TYPE.PERCENTAGE
                ? `${discount.value}%`
                : formatPrice(discount.value, currency, i18n.language);

            return (
              <TableRow key={`${discount.startsAt.toISOString()}-${index}`}>
                <TableCell className="font-medium text-foreground">
                  {discount.type === DISCOUNT_TYPE.PERCENTAGE
                    ? t("services.discounts.typePercentage")
                    : t("services.discounts.typeFixedAmount")}
                </TableCell>
                <TableCell className="text-foreground">
                  {formattedValue}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(discount.startsAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(discount.endsAt)}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                </TableCell>
                <TableCell>
                  <Button
                    ariaLabel={t("services.discounts.removeAction")}
                    disabled={isReadOnly}
                    leftIcon={Trash2}
                    onClick={() => onRemoveDiscount(index)}
                    size={BUTTON_SIZE.SM}
                    type="button"
                    variant={BUTTON_VARIANT.GHOST}
                  >
                    {t("services.discounts.removeAction")}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
