import type { Nullable } from "./types/Nullable.js";

const DATE_PART_SEPARATOR = "-";
const TIME_PART_SEPARATOR = ":";
const TIME_BOUNDS_MS = Object.freeze({
  MS_PER_DAY: 86_400_000,
  MS_PER_SECOND: 1000,
} as const);

const formatterByTimeZone = new Map<string, Intl.DateTimeFormat>();

const readFormatter = (timeZone: string): Intl.DateTimeFormat => {
  const cachedFormatter = formatterByTimeZone.get(timeZone);
  if (cachedFormatter) {
    return cachedFormatter;
  }
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  });
  formatterByTimeZone.set(timeZone, formatter);
  return formatter;
};

// Offset of a time zone from UTC at one instant, in milliseconds. It is the
// same technique as src/utils/date/zonedDayBounds.ts: format the instant in
// the zone and compare the wall clock with UTC. No date library is needed.
const readOffsetInMilliseconds = (
  instant: number,
  timeZone: string,
): number => {
  const parts = readFormatter(timeZone).formatToParts(new Date(instant));
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
    Math.floor(instant / TIME_BOUNDS_MS.MS_PER_SECOND) *
    TIME_BOUNDS_MS.MS_PER_SECOND;

  return instantAsIfUtc - instantWithoutMilliseconds;
};

// The instant a wall-clock time (YYYY-MM-DD and HH:mm) has in an IANA time
// zone. Around a daylight-saving change:
// - a wall-clock time that does not exist (the clocks jump forward) returns
//   null, so callers skip it;
// - a wall-clock time that happens twice (the clocks go back) returns the
//   first of the two instants, so it counts once.
export const resolveZonedInstant = (
  dateText: string,
  timeText: string,
  timeZone: string,
): Nullable<Date> => {
  const [year = 0, month = 1, day = 1] = dateText
    .split(DATE_PART_SEPARATOR)
    .map(Number);
  const [hour = 0, minute = 0] = timeText
    .split(TIME_PART_SEPARATOR)
    .map(Number);
  const wallClockAsIfUtc = Date.UTC(year, month - 1, day, hour, minute);
  // The offset one day before and one day after bracket any single change.
  const possibleOffsets = new Set([
    readOffsetInMilliseconds(
      wallClockAsIfUtc - TIME_BOUNDS_MS.MS_PER_DAY,
      timeZone,
    ),
    readOffsetInMilliseconds(
      wallClockAsIfUtc + TIME_BOUNDS_MS.MS_PER_DAY,
      timeZone,
    ),
  ]);
  const validInstants = [...possibleOffsets]
    .map((offset) => ({ instant: wallClockAsIfUtc - offset, offset }))
    .filter(
      ({ instant, offset }) =>
        readOffsetInMilliseconds(instant, timeZone) === offset,
    )
    .map(({ instant }) => instant);

  return validInstants.length === 0
    ? null
    : new Date(Math.min(...validInstants));
};
