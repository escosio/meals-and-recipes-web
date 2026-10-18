import {
  builtInRecipes,
  buildLibrary,
  searchRecipes,
  filterByTags,
  fitsMeal,
  isMainFor,
  randomRecipe,
  recipeSummary,
  newRecipeId,
  noteId,
  linkify,
  PLAN_MEALS,
} from "../recipes";

const { recipes, getRecipe } = buildLibrary([]);

describe("built-in recipe data", () => {
  test("every recipe has a unique id and a name", () => {
    const ids = new Set(builtInRecipes.map((r) => r.id));
    expect(ids.size).toBe(builtInRecipes.length);
    builtInRecipes.forEach((r) => expect(r.name.length).toBeGreaterThan(0));
  });

  test("recipes are sorted by name", () => {
    const names = builtInRecipes.map((r) => r.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test("every recipe has a valid meal and only known tags", () => {
    const meals = new Set(["Breakfast", "Lunch", "Dinner", "Side", "Any"]);
    const tags = new Set(["Kids", "Quick", "Italian", "Puerto Rican", "Grill", "Cold weather", "Summer"]);
    builtInRecipes.forEach((r) => {
      expect(meals.has(r.meal)).toBe(true);
      r.tags.forEach((t) => expect(tags.has(t)).toBe(true));
    });
  });

  test("the plan only covers dinner", () => {
    expect(PLAN_MEALS).toEqual(["Dinner"]);
  });

  test("sides can go on a dinner but never stand in as the main", () => {
    for (const id of ["smoothie", "potato-salad", "white-rice", "buttered-spaghetti", "buttery-bread", "roasted-potatoes"]) {
      expect(getRecipe(id).meal).toBe("Side");
      expect(fitsMeal(getRecipe(id), "Dinner")).toBe(true);
      expect(isMainFor(getRecipe(id), "Dinner")).toBe(false);
    }
    expect(isMainFor(getRecipe("meatballs"), "Dinner")).toBe(true);
    expect(fitsMeal(getRecipe("pancakes"), "Dinner")).toBe(false);
  });
});

describe("ingredient and step parsing", () => {
  test("newline-separated ingredients become one item per line", () => {
    const r = getRecipe("meatballs");
    expect(r.ingredients[0]).toBe("1 lb. Beef");
    expect(r.ingredients).toContain("one egg");
  });

  test("comma-separated ingredients split before quantities and capitals", () => {
    const r = getRecipe("tacos");
    expect(r.ingredients).toEqual(["Taco kit", "Mexican Cheese", "Ground beef", "Tomatoes", "Greens"]);
  });

  test("a bare source URL is a link, not a step", () => {
    const r = getRecipe("chile");
    expect(r.links).toContain("https://www.delish.com/cooking/recipe-ideas/a58253/best-homemade-chili-recipe/");
    r.steps.forEach((s) => expect(s).not.toMatch(/^https?:\/\/\S+$/));
    expect(r.steps.length).toBe(3);
  });

  test("leading step numbers are stripped", () => {
    const r = getRecipe("french-toast");
    r.steps.forEach((s) => expect(s).not.toMatch(/^\d+\.\s/));
  });

  test("tbd and empty strings mean no recipe", () => {
    const { getRecipe: g } = buildLibrary([
      { id: "x", mealName: "X", meal: "Dinner", ingredient: "tbd", instructions: "" },
    ]);
    expect(g("x").hasRecipe).toBe(false);
    expect(g("x").ingredients).toEqual([]);
  });

  test("summary describes what is written down", () => {
    expect(recipeSummary(getRecipe("tacos"))).toBe("5 ingredients, 1 step");
    expect(recipeSummary({ isNote: true })).toBe("Note");
    const linkOnly = buildLibrary([{ id: "l", mealName: "L", meal: "Dinner", ingredient: "", instructions: "https://example.com/r" }]);
    expect(recipeSummary(linkOnly.getRecipe("l"))).toBe("Link to recipe on example.com");
  });

  test("linkify splits text around URLs", () => {
    const parts = linkify("see https://a.com/x now");
    expect(parts).toEqual(["see ", { url: "https://a.com/x" }, " now"]);
  });
});

describe("search and filters", () => {
  test("search matches name or ingredient, case-insensitively", () => {
    expect(searchRecipes(recipes, "TACO").map((r) => r.id)).toContain("tacos");
    expect(searchRecipes(recipes, "sofrito").map((r) => r.id)).toContain("empanadas");
    expect(searchRecipes(recipes, "")).toBe(recipes);
  });

  test("tag filters combine with AND", () => {
    const kidsQuick = filterByTags(recipes, ["Kids", "Quick"]);
    kidsQuick.forEach((r) => {
      expect(r.tags).toContain("Kids");
      expect(r.tags).toContain("Quick");
    });
    expect(kidsQuick.length).toBeGreaterThan(0);
    expect(filterByTags(recipes, [])).toBe(recipes);
  });

  test("random dinner skips excluded recipes and ones without a recipe", () => {
    const exclude = new Set(recipes.filter((r) => r.id !== "tacos").map((r) => r.id));
    expect(randomRecipe(recipes, "Dinner", exclude).id).toBe("tacos");
    for (let i = 0; i < 40; i++) {
      const r = randomRecipe(recipes, "Dinner");
      expect(isMainFor(r, "Dinner")).toBe(true);
      expect(r.meal).not.toBe("Side");
      expect(r.hasRecipe).toBe(true);
    }
  });
});

describe("notes and quick options", () => {
  test("quick options and free-text notes resolve, and never shop", () => {
    expect(getRecipe("note:leftovers").name).toBe("Leftovers");
    const custom = getRecipe(noteId("  McDonald's "));
    expect(custom).toEqual({ id: "note:McDonald's", name: "McDonald's", meal: "Any", isNote: true });
    expect(getRecipe("note:")).toBeNull();
    expect(getRecipe(null)).toBeNull();
    expect(getRecipe("not-a-recipe")).toBeNull();
  });
});

describe("custom recipes", () => {
  const raw = {
    id: "arroz-con-pollo",
    custom: true,
    mealName: "Arroz con Pollo",
    meal: "Dinner",
    tags: ["Puerto Rican"],
    ingredient: "2 lb chicken\n2 cups rice",
    instructions: "Brown chicken.\nAdd rice.",
    link: "https://example.com/acp",
  };

  test("are merged into the library, sorted, and marked custom", () => {
    const lib = buildLibrary([raw]);
    expect(lib.recipes.length).toBe(builtInRecipes.length + 1);
    const r = lib.getRecipe("arroz-con-pollo");
    expect(r.custom).toBe(true);
    expect(r.ingredients).toEqual(["2 lb chicken", "2 cups rice"]);
    expect(r.steps).toEqual(["Brown chicken.", "Add rice."]);
    expect(r.links).toEqual(["https://example.com/acp"]);
    expect(r.raw).toBe(raw);
    const names = lib.recipes.map((x) => x.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test("new ids never collide with existing recipes", () => {
    expect(newRecipeId("Meatballs", recipes)).toBe("meatballs-2");
    expect(newRecipeId("Brand New Dish!", recipes)).toBe("brand-new-dish");
    expect(newRecipeId("", recipes)).toBe("recipe");
  });
});
