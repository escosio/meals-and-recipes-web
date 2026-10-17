// Week helpers. Weeks start on Monday.

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeek(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - dow);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function weekDays(start) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatWeekRange(start) {
  const end = addDays(start, 6);
  if (start.getMonth() === end.getMonth()) {
    const month = start.toLocaleDateString(undefined, { month: "long" });
    return `${month} ${start.getDate()}–${end.getDate()}`;
  }
  const opts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

export function weekdayShort(d) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export function weekdayLong(d) {
  return d.toLocaleDateString(undefined, { weekday: "long" });
}

export function relativeWeekLabel(start) {
  const thisWeek = startOfWeek(new Date());
  const diff = Math.round((start - thisWeek) / 86400000 / 7);
  if (diff === 0) return "This week";
  if (diff === 1) return "Next week";
  if (diff === -1) return "Last week";
  return null;
}
