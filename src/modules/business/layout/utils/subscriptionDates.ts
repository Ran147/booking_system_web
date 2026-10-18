const MILLISECONDS_IN_DAY = 86_400_000;
const FIRST_ELEMENT_INDEX = 0;
const SECOND_ELEMENT_INDEX = 1;
const THIRD_ELEMENT_INDEX = 2;

export interface FirestoreTimestampLike {
  readonly toDate: () => Date;
}

export const isFirestoreTimestampLike = (
  value: unknown,
): value is FirestoreTimestampLike => {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as FirestoreTimestampLike).toDate === "function"
  );
};

export const parseSubscriptionDate = (dateValue: unknown): Date => {
  if (dateValue instanceof Date) {
    return dateValue;
  }
  if (isFirestoreTimestampLike(dateValue)) {
    return dateValue.toDate();
  }
  if (typeof dateValue === "string" || typeof dateValue === "number") {
    return new Date(dateValue);
  }
  return new Date(Number.NaN);
};

export const getCalendarDayDifference = (
  targetDateInput: unknown,
  timeZone: string,
  referenceDateInput: unknown = new Date(),
): number => {
  const targetDate = parseSubscriptionDate(targetDateInput);
  const referenceDate = parseSubscriptionDate(referenceDateInput);

  if (
    Number.isNaN(targetDate.getTime()) ||
    Number.isNaN(referenceDate.getTime())
  ) {
    return 0;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  });

  const [targetYear, targetMonth, targetDay] = formatter
    .format(targetDate)
    .split("-")
    .map(Number);
  const [referenceYear, referenceMonth, referenceDay] = formatter
    .format(referenceDate)
    .split("-")
    .map(Number);

  const targetUtcMidnight = Date.UTC(
    targetYear ?? FIRST_ELEMENT_INDEX,
    (targetMonth ?? SECOND_ELEMENT_INDEX) - 1,
    targetDay ?? THIRD_ELEMENT_INDEX,
  );
  const referenceUtcMidnight = Date.UTC(
    referenceYear ?? FIRST_ELEMENT_INDEX,
    (referenceMonth ?? SECOND_ELEMENT_INDEX) - 1,
    referenceDay ?? THIRD_ELEMENT_INDEX,
  );

  return Math.round(
    (targetUtcMidnight - referenceUtcMidnight) / MILLISECONDS_IN_DAY,
  );
};

export const formatSubscriptionDate = (
  dateInput: unknown,
  timeZone: string,
  language: string,
): string => {
  const parsedDate = parseSubscriptionDate(dateInput);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeZone,
  }).format(parsedDate);
};

export const calculateGracePeriodExpiry = (
  dateInput: unknown,
  graceDays: number,
): Date => {
  const parsedDate = parseSubscriptionDate(dateInput);
  if (Number.isNaN(parsedDate.getTime())) {
    return new Date(Number.NaN);
  }

  return new Date(parsedDate.getTime() + graceDays * MILLISECONDS_IN_DAY);
};
