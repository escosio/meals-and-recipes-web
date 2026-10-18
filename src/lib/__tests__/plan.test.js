import { resolveSlot, toList, dowOf, dowName, DEFAULT_ROUTINE } from "../plan";

// 2026-10-12 is a Monday.
const MON = "2026-10-12";
const FRI = "2026-10-16";
const SUN = "2026-10-18";

describe("weekday helpers", () => {
  test("dowOf uses Monday = 0", () => {
    expect(dowOf(MON)).toBe(0);
    expect(dowOf(FRI)).toBe(4);
    expect(dowOf(SUN)).toBe(6);
  });

  test("dowName names the day", () => {
    expect(dowName(0)).toBe("Monday");
    expect(dowName(6)).toBe("Sunday");
  });
});

describe("toList", () => {
  test("accepts legacy single ids, nulls and lists", () => {
    expect(toList(null)).toEqual([]);
    expect(toList(undefined)).toEqual([]);
    expect(toList("tacos")).toEqual(["tacos"]);
    expect(toList(["a", null, "b"])).toEqual(["a", "b"]);
  });
});

describe("the family routine", () => {
  test("Sunday is meatballs, Monday leftovers, Friday takeout", () => {
    expect(toList(DEFAULT_ROUTINE[6].Dinner)).toEqual(["meatballs"]);
    expect(toList(DEFAULT_ROUTINE[0].Dinner)[0]).toMatch(/^note:Leftover/);
    expect(toList(DEFAULT_ROUTINE[4].Dinner)).toEqual(["note:takeout"]);
    expect(DEFAULT_ROUTINE[4].Lunch).toBeUndefined();
  });
});

describe("resolveSlot", () => {
  test("falls back to the routine when the week has no entry", () => {
    const slot = resolveSlot({}, DEFAULT_ROUTINE, SUN, "Dinner");
    expect(slot).toEqual({ ids: ["meatballs"], routineIds: ["meatballs"] });
  });

  test("an explicit entry overrides the routine for that week", () => {
    const plan = { [SUN]: { Dinner: ["tacos"] } };
    const slot = resolveSlot(plan, DEFAULT_ROUTINE, SUN, "Dinner");
    expect(slot.ids).toEqual(["tacos"]);
    expect(slot.routineIds).toEqual([]);
  });

  test("an explicit empty list clears a routine night for one week only", () => {
    const plan = { [SUN]: { Dinner: [] } };
    expect(resolveSlot(plan, DEFAULT_ROUTINE, SUN, "Dinner").ids).toEqual([]);
    expect(resolveSlot(plan, DEFAULT_ROUTINE, "2026-10-25", "Dinner").ids).toEqual(["meatballs"]);
  });

  test("routine dishes kept alongside additions are still flagged as routine", () => {
    const plan = { [SUN]: { Dinner: ["meatballs", "potato-salad"] } };
    const slot = resolveSlot(plan, DEFAULT_ROUTINE, SUN, "Dinner");
    expect(slot.ids).toEqual(["meatballs", "potato-salad"]);
    expect(slot.routineIds).toEqual(["meatballs"]);
  });

  test("legacy single-id plans and routines still resolve", () => {
    const plan = { [MON]: { Dinner: "tacos" } };
    const routine = { 6: { Dinner: "meatballs" } };
    expect(resolveSlot(plan, routine, MON, "Dinner").ids).toEqual(["tacos"]);
    expect(resolveSlot(plan, routine, SUN, "Dinner").ids).toEqual(["meatballs"]);
    expect(resolveSlot({ [MON]: { Dinner: null } }, routine, MON, "Dinner").ids).toEqual([]);
  });

  test("a night with nothing anywhere is empty", () => {
    expect(resolveSlot({}, {}, MON, "Dinner")).toEqual({ ids: [], routineIds: [] });
  });
});
