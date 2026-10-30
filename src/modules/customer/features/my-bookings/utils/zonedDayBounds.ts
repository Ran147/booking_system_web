import { TIME_ZONE_OFFSET } from "../constants";

const DATE_PART_SEPARATOR = "-";
const ISO_DATE_LENGTH = 10;

const readOffsetInMilliseconds = (
  instant: number,
  timeZone: string,
): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(instant));
  const readPart = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);
  const instantAsIfUtc = Date.UTC(
    readPart("year"),
    readPart("month") - 1,
    readPart("day"),
    readPart("hour"),
    readPart("minute"),
    readPart("second"),
  );
  const instantWithoutMilliseconds =
    Math.floor(instant / TIME_ZONE_OFFSET.MS_PER_SECOND) *
    TIME_ZONE_OFFSET.MS_PER_SECOND;

  return instantAsIfUtc - instantWithoutMilliseconds;
};

// First instant of a calendar day (YYYY-MM-DD) in the given IANA time zone.
const startOfZonedDay = (dateText: string, timeZone: string): Date => {
  const [year = 0, month = 1, day = 1] = dateText
    .split(DATE_PART_SEPARATOR)
    .map(Number);
  const dayAsIfUtc = Date.UTC(year, month - 1, day);
  const firstGuess =
    dayAsIfUtc - readOffsetInMilliseconds(dayAsIfUtc, timeZone);

  return new Date(dayAsIfUtc - readOffsetInMilliseconds(firstGuess, timeZone));
};

const nextDay = (dateText: string): string =>
  new Date(Date.parse(dateText) + TIME_ZONE_OFFSET.MS_PER_DAY)
    .toISOString()
    .slice(0, ISO_DATE_LENGTH);

// The instants a calendar day covers in a time zone, both inclusive.
export const zonedDayBounds = (
  dateText: string,
  timeZone: string,
): { end: Date; start: Date } => ({
  end: new Date(
    startOfZonedDay(nextDay(dateText), timeZone).getTime() -
      TIME_ZONE_OFFSET.ONE_MS,
  ),
  start: startOfZonedDay(dateText, timeZone),
});
