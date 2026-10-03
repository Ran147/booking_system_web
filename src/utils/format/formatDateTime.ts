export const formatDateTime = (
  dateTime: Date,
  timeZone: string,
  language: string,
): string =>
  new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(dateTime);
