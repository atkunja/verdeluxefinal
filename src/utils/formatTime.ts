export function formatTime(time: string): string {
  if (!time) return "";
  return formatTime12Hour(time);
}

export function formatTime12Hour(time: string): string {
  if (!time) return "";
  const [rawHour, rawMinute] = time.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute || 0);
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelveHour = ((hour + 11) % 12) + 1;
  const minutePadded = minute.toString().padStart(2, "0");
  return `${twelveHour}:${minutePadded} ${suffix}`;
}

// Format a date (string or Date) in America/Detroit timezone for consistent UI display.
export function formatDetroitDate(value: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Detroit",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...opts,
  });
  return formatter.format(date);
}

// Convert decimal hours to "Xh Ym" display
export function formatDurationHours(hours: number | null | undefined): string {
  if (!hours && hours !== 0) return "—";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
