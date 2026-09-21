export interface BlockedInterval {
  start: Date;
  end: Date;
}

export interface AvailabilityInput {
  date: string;
  timezone: string;
  workingWindows: Array<{ startTime: string; endTime: string }>;
  blocked: BlockedInterval[];
  durationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  slotStepMinutes?: number;
  notBefore?: Date;
}

export interface AvailableSlot {
  start: Date;
  end: Date;
}

const MINUTE = 60_000;

function parseClock(value: string) {
  const [hours = "0", minutes = "0", seconds = "0"] = value.split(":");
  return {
    hours: Number(hours),
    minutes: Number(minutes),
    seconds: Number(seconds),
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const representedAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  return representedAsUtc - date.getTime();
}

export function formatDateInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDaysToLocalDate(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Convert a salon-local wall-clock value to the corresponding UTC instant. */
export function localDateTimeToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const { hours, minutes, seconds } = parseClock(time);
  const wallClockAsUtc = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

  let offset = timeZoneOffsetMs(wallClockAsUtc, timeZone);
  let result = new Date(wallClockAsUtc.getTime() - offset);

  // Re-check because the first guess can land across a DST boundary.
  const correctedOffset = timeZoneOffsetMs(result, timeZone);
  if (correctedOffset !== offset) {
    offset = correctedOffset;
    result = new Date(wallClockAsUtc.getTime() - offset);
  }

  return result;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Pure slot generator. The DB remains the final concurrency guard; this
 * function only computes what can be offered to a user at request time.
 */
export function generateAvailableSlots(input: AvailabilityInput): AvailableSlot[] {
  const duration = input.durationMinutes * MINUTE;
  const before = (input.bufferBeforeMinutes ?? 0) * MINUTE;
  const after = (input.bufferAfterMinutes ?? 0) * MINUTE;
  const step = Math.max(input.slotStepMinutes ?? 10, 1) * MINUTE;
  const slots: AvailableSlot[] = [];

  if (input.durationMinutes <= 0) return slots;

  for (const window of input.workingWindows) {
    const windowStart = localDateTimeToUtc(input.date, window.startTime, input.timezone);
    const windowEnd = localDateTimeToUtc(input.date, window.endTime, input.timezone);

    for (let cursor = windowStart.getTime(); cursor + duration <= windowEnd.getTime(); cursor += step) {
      const start = new Date(cursor);
      const end = new Date(cursor + duration);
      const effectiveStart = new Date(start.getTime() - before);
      const effectiveEnd = new Date(end.getTime() + after);

      if (input.notBefore && start < input.notBefore) continue;

      const collides = input.blocked.some((blocked) =>
        overlaps(effectiveStart, effectiveEnd, blocked.start, blocked.end),
      );

      if (!collides) slots.push({ start, end });
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}
