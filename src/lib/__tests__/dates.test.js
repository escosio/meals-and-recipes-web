import { startOfWeek, weekDays, toISODate, parseISODate, addDays, formatWeekRange, isSameDay, relativeWeekLabel } from "../dates";

describe("week math", () => {
  test("weeks start on Monday", () => {
    // Wed 2026-10-14 -> Mon 2026-10-12; Sun 2026-10-18 -> same Monday; Mon stays Mon.
    expect(toISODate(startOfWeek(new Date(2026, 9, 14)))).toBe("2026-10-12");
    expect(toISODate(startOfWeek(new Date(2026, 9, 18)))).toBe("2026-10-12");
    expect(toISODate(startOfWeek(new Date(2026, 9, 12)))).toBe("2026-10-12");
  });

  test("weekDays yields seven consecutive days", () => {
    const days = weekDays(new Date(2026, 9, 12)).map(toISODate);
    expect(days).toEqual(["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]);
  });

  test("ISO dates round-trip without timezone drift", () => {
    expect(toISODate(parseISODate("2026-03-01"))).toBe("2026-03-01");
    expect(toISODate(addDays(parseISODate("2026-12-31"), 1))).toBe("2027-01-01");
  });

  test("formatWeekRange handles same and different months", () => {
    expect(formatWeekRange(new Date(2026, 9, 12))).toBe("October 12–18");
    expect(formatWeekRange(new Date(2026, 9, 26))).toMatch(/Oct 26 – Nov 1/);
  });

  test("isSameDay ignores time of day", () => {
    expect(isSameDay(new Date(2026, 0, 1, 1), new Date(2026, 0, 1, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(false);
  });

  test("relative week labels", () => {
    const thisWeek = startOfWeek(new Date());
    expect(relativeWeekLabel(thisWeek)).toBe("This week");
    expect(relativeWeekLabel(addDays(thisWeek, 7))).toBe("Next week");
    expect(relativeWeekLabel(addDays(thisWeek, -7))).toBe("Last week");
    expect(relativeWeekLabel(addDays(thisWeek, 21))).toBeNull();
  });
});
