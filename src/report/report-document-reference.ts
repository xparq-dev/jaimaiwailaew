const REPORT_REFERENCE_PREFIX = "JMWL";

function bangkokDateTimeParts(date: Date): Record<string, string> {
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("Report reference requires a valid date.");
  }

  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
      hourCycle: "h23",
      timeZone: "Asia/Bangkok",
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
}

export function createReportDocumentReference(date: Date): string {
  const parts = bangkokDateTimeParts(date);

  return [
    REPORT_REFERENCE_PREFIX,
    `${parts.year}${parts.month}${parts.day}`,
    `${parts.hour}${parts.minute}${parts.second}`,
    parts.fractionalSecond,
  ].join("-");
}
