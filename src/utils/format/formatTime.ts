export const formatTime = (
  dateTime: Date,
  timeZone: string,
  language: string,
): string =>
  new Intl.DateTimeFormat(language, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(dateTime);
