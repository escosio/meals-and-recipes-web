import { useMemo, useState } from "react";
import { recipes, searchRecipes, filterByTags, recipeSummary, MEALS } from "../lib/recipes";
import TagFilter from "./TagFilter";

const FILTERS = ["All", ...MEALS, ...(recipes.some((r) => r.meal === "Any") ? ["Any time"] : [])];

export default function RecipeLibrary({ plannedThisWeek, onOpenRecipe }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [tags, setTags] = useState([]);

  const visible = useMemo(() => {
    let list = recipes;
    if (filter === "Any time") list = list.filter((r) => r.meal === "Any");
    else if (filter !== "All") list = list.filter((r) => r.meal === filter || r.meal === "Any");
    return searchRecipes(filterByTags(list, tags), query);
  }, [query, filter, tags]);

  const grouped = useMemo(() => {
    if (filter !== "All") return [[null, visible]];
    const order = ["Breakfast", "Lunch", "Dinner", "Any"];
    return order
      .map((m) => [m === "Any" ? "Any time" : m, visible.filter((r) => r.meal === m)])
      .filter(([, list]) => list.length);
  }, [visible, filter]);

  return (
    <section aria-labelledby="recipes-title">
      <header className="weeknav">
        <div>
          <h1 id="recipes-title">Recipes</h1>
          <p className="sub">{recipes.length} in the book. Tap one to read it or add it to the week.</p>
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
          {FILTERS.map((f) => (
            <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <TagFilter selected={tags} onChange={setTags} />

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
                        <strong>{r.name}</strong>
                        <small>{recipeSummary(r)}</small>
                      </div>
                      <div className="meta">
                        {planned && <span className="pill gold">{planned.join(", ")}</span>}
                        {r.tags.slice(0, 2).map((t) => (
                          <span key={t} className="pill muted tag-pill">{t}</span>
                        ))}
                        {filter === "All" && r.meal === "Any" && <span className="pill muted">Any time</span>}
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
