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

/**
 * What's in a slot once the weekly routine is taken into account.
 * An explicit null in the plan means "cleared for this week only".
 */
export function resolveSlot(plan, routine, dateKey, meal) {
  const day = plan[dateKey];
  if (day && Object.prototype.hasOwnProperty.call(day, meal)) {
    return { id: day[meal] || null, fromRoutine: false };
  }
  const id = routine[dowOf(dateKey)]?.[meal] || null;
  return { id, fromRoutine: !!id };
}
