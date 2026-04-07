import type { BusinessHours } from "./db/schema";
import type { BusyPeriod } from "./google-calendar";

type Slot = {
  start: string; // ISO string
  end: string;
};

const DAY_KEYS: (keyof Omit<BusinessHours, "slot_interval_min">)[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

export function generateSlots(
  businessHours: BusinessHours,
  date: string,
  durationMin: number,
  slotIntervalMin: number
): Slot[] {
  const dayOfWeek = new Date(`${date}T12:00:00+09:00`).getUTCDay();
  const dayKey = DAY_KEYS[dayOfWeek];
  const ranges = businessHours[dayKey];

  if (!ranges || ranges.length === 0) return [];

  const slots: Slot[] = [];

  for (const range of ranges) {
    const [startStr, endStr] = range.split("-");
    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);

    const rangeStartMin = startH * 60 + startM;
    const rangeEndMin = endH * 60 + endM;

    for (
      let min = rangeStartMin;
      min + durationMin <= rangeEndMin;
      min += slotIntervalMin
    ) {
      const slotStartH = Math.floor(min / 60);
      const slotStartM = min % 60;
      const slotEndTotalMin = min + durationMin;
      const slotEndH = Math.floor(slotEndTotalMin / 60);
      const slotEndM = slotEndTotalMin % 60;

      const pad = (n: number) => n.toString().padStart(2, "0");

      slots.push({
        start: `${date}T${pad(slotStartH)}:${pad(slotStartM)}:00+09:00`,
        end: `${date}T${pad(slotEndH)}:${pad(slotEndM)}:00+09:00`,
      });
    }
  }

  return slots;
}

export function filterAvailableSlots(
  slots: Slot[],
  busyPeriods: BusyPeriod[]
): Slot[] {
  return slots.filter((slot) => {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();

    return !busyPeriods.some((busy) => {
      const busyStart = new Date(busy.start).getTime();
      const busyEnd = new Date(busy.end).getTime();
      return slotStart < busyEnd && slotEnd > busyStart;
    });
  });
}
