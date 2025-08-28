import { defaultTimezone, primaryLocation } from '../data/contact';

export const SPA_TIMEZONE = defaultTimezone;

// Derive a conservative opening window across the week in local time
function deriveOpenClose() {
  const daySlots = Object.values(primaryLocation.hoursByDay || {});
  const opens: number[] = [];
  const closes: number[] = [];
  daySlots.forEach((slots) => {
    slots.forEach((s) => {
      const o = parseInt(s.open.split(':')[0] || '0', 10);
      const c = parseInt(s.close.split(':')[0] || '0', 10);
      if (!Number.isNaN(o)) opens.push(o);
      if (!Number.isNaN(c)) closes.push(c);
    });
  });
  const openHour = opens.length ? Math.min(...opens) : 9;
  const closeHour = closes.length ? Math.max(...closes) : 19;
  return { openHour, closeHour } as const;
}

export const OPENING_HOURS = deriveOpenClose();

export const SLOT_INCREMENT_MIN = 15; // for future slot rounding
