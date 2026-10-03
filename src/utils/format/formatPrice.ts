import { MONEY } from "@/shared/constants";

export const formatPrice = (
  priceInCents: number,
  currencyCode: string,
  language: string,
): string =>
  new Intl.NumberFormat(language, {
    currency: currencyCode,
    style: "currency",
  }).format(priceInCents / MONEY.CENTS_PER_UNIT);
