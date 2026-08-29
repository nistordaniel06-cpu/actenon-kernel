// Mock timestamps are derived from Date.now() at module load time, which runs
// once on the server and once on the client. Rounding to a 15-minute bucket
// keeps both renders identical (they happen milliseconds apart) and avoids
// React hydration mismatches on displayed times.
const BUCKET_MS = 15 * 60_000;

export function inMin(mins: number) {
  const t = Math.round((Date.now() + mins * 60_000) / BUCKET_MS) * BUCKET_MS;
  return new Date(t).toISOString();
}

// Deterministic "N days ago" with a fixed, non-drifting time of day derived
// from the day offset itself (never from the live clock), so server and
// client renders always agree.
export function daysAgo(d: number) {
  const dt = new Date(Date.now() - d * 86_400_000);
  const hour = 9 + ((d * 3) % 10);
  const minute = ((d * 17) % 4) * 15;
  dt.setHours(hour, minute, 0, 0);
  return dt.toISOString();
}
