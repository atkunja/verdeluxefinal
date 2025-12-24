// Normalize start/end for inclusive date filters in America/Detroit
export function normalizeDetroitRange(start?: string | Date, end?: string | Date) {
  const toDate = (val?: string | Date) =>
    val ? (typeof val === "string" ? new Date(val) : val) : null;

  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate && !endDate) {
    return { start: null, end: null };
  }

  const tz = "America/Detroit";
  const startNormalized = startDate
    ? new Date(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
          .format(startDate)
          .replace(/-/g, "/") + " 00:00:00"
      )
    : null;

  const endNormalized = endDate
    ? new Date(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
          .format(endDate)
          .replace(/-/g, "/") + " 23:59:59"
      )
    : null;

  return { start: startNormalized, end: endNormalized };
}
