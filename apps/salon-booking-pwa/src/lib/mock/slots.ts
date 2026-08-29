export interface DaySlots {
  dateIso: string;
  label: string;
  slots: { iso: string; available: boolean }[];
}

function hashSeed(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OPEN_HOUR = 9;
const CLOSE_HOUR = 20;

export function generateSlots(barberId: string, durationMin: number, days = 5): DaySlots[] {
  const rand = mulberry32(hashSeed(barberId));
  const result: DaySlots[] = [];
  const stepMin = 30;

  for (let d = 0; d < days; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    date.setHours(0, 0, 0, 0);

    const slots: { iso: string; available: boolean }[] = [];
    for (let mins = OPEN_HOUR * 60; mins + durationMin <= CLOSE_HOUR * 60; mins += stepMin) {
      const slotDate = new Date(date);
      slotDate.setMinutes(mins);
      const isPast = d === 0 && slotDate.getTime() < Date.now();
      const available = !isPast && rand() > 0.38;
      slots.push({ iso: slotDate.toISOString(), available });
    }

    result.push({
      dateIso: date.toISOString(),
      label:
        d === 0
          ? "Today"
          : d === 1
            ? "Tomorrow"
            : new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric" }).format(date),
      slots,
    });
  }

  return result;
}
