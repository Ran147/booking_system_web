export const parseZonedDateTime = (
  dateText: string,
  timeText: string,
  timeZone: string,
): Date => {
  const [year = 0, month = 1, day = 1] = dateText.split("-").map(Number);
  const [hours = 0, minutes = 0] = timeText.split(":").map(Number);
  const targetUtc = Date.UTC(year, month - 1, day, hours, minutes, 0);

  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(targetUtc));

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

  const offset = instantAsIfUtc - targetUtc;
  return new Date(targetUtc - offset);
};
