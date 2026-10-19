import { recipes as rawRecipes } from "../recipes";

export const MEALS = ["Breakfast", "Lunch", "Dinner"];
// Sides go with any dinner but never stand in for one.
export const SIDE = "Side";
export const FORM_MEALS = [...MEALS, SIDE];
// Dinner is the meal we plan; lunch and breakfast can be added to a day when needed.
export const PRIMARY_MEAL = "Dinner";
export const EXTRA_MEALS = ["Lunch", "Breakfast"];
export const PLAN_MEALS = [PRIMARY_MEAL, ...EXTRA_MEALS];
// Display order for tag filters.
export const TAGS = ["Kids", "Quick", "Italian", "Puerto Rican", "Grill", "Cold weather", "Summer"];

const EMPTY_VALUES = new Set(["", "tbd", "n/a", "na", "sj", "none", "-"]);
const URL_RE = /(https?:\/\/[^\s)]+)/g;

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isEmptyText(s) {
  return EMPTY_VALUES.has((s || "").trim().toLowerCase());
}

function splitIngredients(text) {
  if (isEmptyText(text)) return [];
  const t = text.trim();
  if (t.includes("\n")) {
    return t
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  }
  // Comma-separated on one line. Split before a quantity or a capitalised word
  // so "red potatoes, chopped, 3 cups mayo" keeps "chopped" with the potatoes.
  let parts = t.split(/,\s*(?=[\d½¼¾⅓⅔⅛A-Z])/).map((p) => p.trim());
  if (parts.length === 1) parts = t.split(",").map((p) => p.trim());
  return parts.filter(Boolean);
}

function splitSteps(text) {
  if (isEmptyText(text)) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^step\s*\d+$/i.test(l))
    // A bare link is a source, not a step.
    .filter((l) => !/^https?:\/\/\S+$/.test(l))
    .map((l) => l.replace(/^(step\s*\d+[:.)]?\s*|\d+[.)]\s*)/i, "").trim())
    .filter(Boolean);
}

function extractLinks(text) {
  return Array.from((text || "").matchAll(URL_RE), (m) => m[1]);
}

function normalise(raw) {
  const ingredients = splitIngredients(raw.ingredient);
  const steps = splitSteps(raw.instructions);
  const links = extractLinks(raw.instructions).concat(extractLinks(raw.ingredient));
  if (raw.link && !links.includes(raw.link)) links.push(raw.link);
  const meal = raw.meal === "All" ? "Any" : raw.meal;
  return {
    id: raw.id || slugify(raw.mealName),
    name: raw.mealName.trim(),
    meal,
    ingredients,
    steps,
    links,
    tags: raw.tags || [],
    custom: !!raw.custom,
    raw,
    // A recipe with only a link still counts as written.
    hasRecipe: ingredients.length > 0 || steps.length > 0 || links.length > 0,
  };
}

// Quick non-recipe options you can put in a slot.
export const QUICK_OPTIONS = [
  { id: "note:leftovers", name: "Leftovers", meal: "Any", isNote: true },
  { id: "note:takeout", name: "Takeout", meal: "Any", isNote: true },
  { id: "note:eating-out", name: "Eating out", meal: "Any", isNote: true },
];

const byName = (a, b) => a.name.localeCompare(b.name);

/** Recipes that ship with the app. */
export const builtInRecipes = rawRecipes.map(normalise).sort(byName);

/**
 * The full library: built-ins plus recipes added in the app. Custom recipes
 * are stored raw (same shape as recipes.ts entries, plus id and custom: true)
 * so they can be saved as plain JSON and later synced between phones.
 */
export function buildLibrary(customRaw = [], hiddenIds = []) {
  const custom = customRaw.map(normalise);
  const all = [...builtInRecipes, ...custom].sort(byName);
  const hiddenSet = new Set(hiddenIds);
  // Removed built-ins stay resolvable (a planned night still shows them) but leave the book.
  const recipes = all.filter((r) => !hiddenSet.has(r.id));
  const hidden = all.filter((r) => hiddenSet.has(r.id));
  const map = new Map(all.map((r) => [r.id, r]));
  QUICK_OPTIONS.forEach((q) => map.set(q.id, q));
  const getRecipe = (id) => {
    if (!id) return null;
    const known = map.get(id);
    if (known) return known;
    // Free-text notes typed into a slot, e.g. "note:McDonald's".
    if (id.startsWith("note:")) {
      const name = id.slice(5).trim();
      return name ? { id, name, meal: "Any", isNote: true } : null;
    }
    return null;
  };
  return { recipes, hidden, getRecipe };
}

/** A unique id for a new custom recipe, avoiding clashes with existing ones. */
export function newRecipeId(name, existing) {
  const base = slugify(name) || "recipe";
  const taken = new Set(existing.map((r) => r.id));
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  return id;
}

export function noteId(text) {
  return `note:${text.trim()}`;
}

/** Can this recipe be put on a slot for `meal`? Sides and any-time recipes fit everywhere. */
export function fitsMeal(recipe, meal) {
  return !meal || recipe.meal === meal || recipe.meal === "Any" || recipe.meal === SIDE;
}

/** Can this recipe be the main dish for `meal`? Excludes sides. */
export function isMainFor(recipe, meal) {
  return fitsMeal(recipe, meal) && recipe.meal !== SIDE;
}

export function mealLabel(meal) {
  if (meal === "Any") return "Any time";
  return meal;
}

export function filterByTags(list, tags) {
  if (!tags || tags.length === 0) return list;
  return list.filter((r) => tags.every((t) => r.tags.includes(t)));
}

/** Split a list into [favorites, everything else], keeping order. */
export function splitFavorites(list, favorites) {
  if (!favorites || favorites.size === 0) return [[], list];
  return [list.filter((r) => favorites.has(r.id)), list.filter((r) => !favorites.has(r.id))];
}

export function searchRecipes(list, query) {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (r) => r.name.toLowerCase().includes(q) || r.ingredients.some((i) => i.toLowerCase().includes(q)),
  );
}

export function randomRecipe(recipes, meal, exclude = new Set()) {
  const pool = recipes.filter(
    (r) => isMainFor(r, meal) && r.hasRecipe && !exclude.has(r.id),
  );
  const fallback = recipes.filter((r) => isMainFor(r, meal));
  const list = pool.length ? pool : fallback;
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/** One-line description for lists: "5 ingredients, 3 steps", "Link to recipe", etc. */
export function recipeSummary(r) {
  if (r.isNote) return "Note";
  const parts = [];
  if (r.ingredients.length) parts.push(`${r.ingredients.length} ingredient${r.ingredients.length === 1 ? "" : "s"}`);
  if (r.steps.length) parts.push(`${r.steps.length} step${r.steps.length === 1 ? "" : "s"}`);
  if (parts.length) return parts.join(", ");
  if (r.links.length) return `Link to recipe on ${hostOf(r.links[0])}`;
  return "No recipe written yet";
}

export function linkify(text) {
  // Returns an array of strings and { url } objects for rendering.
  const out = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ url: m[1] });
    last = m.index + m[1].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
