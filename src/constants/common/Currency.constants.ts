export const CURRENCY_CODE = Object.freeze({
  CRC: "CRC",
  MXN: "MXN",
  USD: "USD",
});

export type CurrencyCode = (typeof CURRENCY_CODE)[keyof typeof CURRENCY_CODE];
