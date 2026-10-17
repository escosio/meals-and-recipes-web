import { parseISODate, weekdayLong } from "./dates";

// Weekday index with Monday = 0, matching startOfWeek.
export function dowOf(dateKey) {
  return (parseISODate(dateKey).getDay() + 6) % 7;
}

export function dowName(dow) {
  // Any Monday works as a reference; 2024-01-01 was a Monday.
  const d = new Date(2024, 0, 1 + dow);
  return weekdayLong(d);
}

// Things you make every week, keyed by weekday then meal.
export const DEFAULT_ROUTINE = {
  0: { Dinner: "note:Leftover meatballs" }, // Monday
  4: { Dinner: "note:Pizza or McDonald's" }, // Friday
  6: { Dinner: "meatballs" }, // Sunday
};

/** Slots hold a list of ids. Older data stored a single id or null. */
export function toList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

/**
 * What's in a slot once the weekly routine is taken into account.
 * An explicit entry in the plan (even an empty list) overrides the routine
 * for that week only. routineIds says which of the ids come from the routine.
 */
export function resolveSlot(plan, routine, dateKey, meal) {
  const routineIds = toList(routine[dowOf(dateKey)]?.[meal]);
  const day = plan[dateKey];
  if (day && Object.prototype.hasOwnProperty.call(day, meal)) {
    const ids = toList(day[meal]);
    return { ids, routineIds: routineIds.filter((id) => ids.includes(id)), explicit: true };
  }
  return { ids: routineIds, routineIds, explicit: false };
}
