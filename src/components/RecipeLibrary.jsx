import { useMemo, useState } from "react";
import { searchRecipes, filterByTags, splitFavorites, recipeSummary, mealLabel, MEALS, SIDE } from "../lib/recipes";
import { useRecipes } from "../lib/RecipesContext";
import TagFilter from "./TagFilter";

export default function RecipeLibrary({ favorites, plannedThisWeek, onOpenRecipe, onAddRecipe }) {
  const { recipes } = useRecipes();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [tags, setTags] = useState([]);

  const visible = useMemo(() => {
    let list = recipes;
    if (filter === "Sides") list = list.filter((r) => r.meal === SIDE);
    else if (filter !== "All") list = list.filter((r) => r.meal === filter || r.meal === "Any");
    return searchRecipes(filterByTags(list, tags), query);
  }, [query, filter, tags, recipes]);

  // Favorites get their own section on top; the rest group by meal.
  const grouped = useMemo(() => {
    const [favs, rest] = splitFavorites(visible, favorites);
    const favGroup = favs.length ? [["Favorites", favs]] : [];
    if (filter !== "All") return [...favGroup, [favs.length ? filter : null, rest]].filter(([, list]) => list.length);
    const order = [...MEALS, SIDE, "Any"];
    return [
      ...favGroup,
      ...order
        .map((m) => [m === SIDE ? "Sides" : mealLabel(m), rest.filter((r) => r.meal === m)])
        .filter(([, list]) => list.length),
    ];
  }, [visible, filter, favorites]);

  return (
    <section aria-labelledby="recipes-title">
      <header className="weeknav">
        <h1 id="recipes-title">Recipes</h1>
        <div className="controls">
          <button className="btn primary" onClick={onAddRecipe}>
            Add recipe
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="search">
          <span className="glyph" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or ingredient"
            aria-label="Search recipes"
          />
        </div>
        <div className="chips" role="group" aria-label="Filter by meal">
          {["All", ...MEALS, "Sides"].map((f) => (
            <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}
              {f === "All" && <span className="count">{recipes.length}</span>}
            </button>
          ))}
        </div>
        <TagFilter selected={tags} onChange={setTags} />
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <strong>No recipes match</strong>
          Try a different word, or clear a filter.
        </div>
      ) : (
        grouped.map(([label, list]) => (
          <div key={label || "all"}>
            {label && <h2 className="group-head">{label}</h2>}
            <ul className="list">
              {list.map((r) => {
                const planned = plannedThisWeek.get(r.id);
                return (
                  <li key={r.id}>
                    <button className="row" onClick={() => onOpenRecipe(r.id)}>
                      <div className="title">
                        <strong>
                          {favorites.has(r.id) && <span className="fav" aria-hidden="true">★ </span>}
                          {r.name}
                        </strong>
                        <small>{recipeSummary(r)}</small>
                      </div>
                      <div className="meta">
                        {planned && <span className="pill gold">{planned.join(", ")}</span>}
                        {r.custom && <span className="pill">Yours</span>}
                        {r.tags.slice(0, 2).map((t) => (
                          <span key={t} className="pill muted tag-pill">{t}</span>
                        ))}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
