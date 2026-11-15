import { WEEKDAY_BY_UTC_DAY } from "../constants/Availability.constants";

const DATE_PART_SEPARATOR = "-";
const ISO_DATE_LENGTH = 10;
// en-CA formats a date as YYYY-MM-DD.
const ISO_DATE_LOCALE = "en-CA";

const parseDate = (date: string): number => {
  const [year = 0, month = 1, day = 1] = date
    .split(DATE_PART_SEPARATOR)
    .map(Number);
  return Date.UTC(year, month - 1, day);
};

/** The calendar day (YYYY-MM-DD) an instant falls on in an IANA time zone. */
export const formatZonedDate = (instant: Date, timeZone: string): string =>
  new Intl.DateTimeFormat(ISO_DATE_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).format(instant);

/** The calendar day `days` after another; daylight saving cannot shift it. */
export const addCalendarDays = (date: string, days: number): string => {
  const shifted = new Date(parseDate(date));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, ISO_DATE_LENGTH);
};

const MS_PER_DAY = 86_400_000;

/** Whole calendar days from one day to another (negative when earlier). */
export const countDaysBetween = (from: string, to: string): number =>
  Math.round((parseDate(to) - parseDate(from)) / MS_PER_DAY);

/** The weekday key of businessHours (`monday` …) of a calendar day. */
export const readWeekday = (date: string): string =>
  WEEKDAY_BY_UTC_DAY[new Date(parseDate(date)).getUTCDay()] ?? "";

/** The calendar day as a Date at UTC noon, to format it without shifting. */
export const toDisplayDate = (date: string): Date =>
  new Date(`${date}T12:00:00.000Z`);
