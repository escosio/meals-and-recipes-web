import { useEffect, useMemo, useState } from "react";
import Sheet from "./Sheet";
import { recipes, QUICK_OPTIONS, fitsMeal, searchRecipes, randomRecipe, recipeSummary, noteId } from "../lib/recipes";
import { weekdayLong } from "../lib/dates";

export default function RecipePicker({ open, slot, plannedIds, onClose, onPick }) {
  const [query, setQuery] = useState("");
  const [onlyThisMeal, setOnlyThisMeal] = useState(true);

  useEffect(() => {
    if (open) {
      setQuery("");
      setOnlyThisMeal(true);
    }
  }, [open, slot]);

  const list = useMemo(() => {
    if (!slot) return [];
    const base = onlyThisMeal ? recipes.filter((r) => fitsMeal(r, slot.meal)) : recipes;
    return searchRecipes(base, query);
  }, [slot, query, onlyThisMeal]);

  if (!slot) return <Sheet open={false} onClose={onClose} title="" />;

  const dayName = weekdayLong(new Date(slot.date + "T00:00"));
  const pickRandom = () => {
    const r = randomRecipe(slot.meal, plannedIds);
    if (r) onPick(slot, r.id);
  };

  return (
    <Sheet open={open} onClose={onClose} title={`${dayName} ${slot.meal.toLowerCase()}`} subtitle="Choose what to make">
      <div className="toolbar" style={{ marginTop: 0 }}>
        <div className="search">
          <span className="glyph" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes"
            aria-label="Search recipes"
            autoFocus
          />
        </div>
      </div>
      <div className="quick">
        <button className="chip" onClick={pickRandom}>Pick for me</button>
        {QUICK_OPTIONS.map((q) => (
          <button key={q.id} className="chip" onClick={() => onPick(slot, q.id)}>
            {q.name}
          </button>
        ))}
        <button className="chip" aria-pressed={!onlyThisMeal} onClick={() => setOnlyThisMeal((v) => !v)}>
          {onlyThisMeal ? `Only ${slot.meal.toLowerCase()} recipes` : "All recipes"}
        </button>
      </div>

      {query.trim() && (
        <button className="row note-row" onClick={() => onPick(slot, noteId(query))}>
          <div className="title">
            <strong>Use “{query.trim()}” as a note</strong>
            <small>For takeout, eating out, or anything not in the book</small>
          </div>
        </button>
      )}
      {list.length === 0 ? (
        <div className="empty">
          <strong>No recipe called that</strong>
          Try another word, show all recipes, or keep it as a note.
        </div>
      ) : (
        <ul className="picker-list list">
          {list.map((r) => (
            <li key={r.id}>
              <button className="row" onClick={() => onPick(slot, r.id)}>
                <div className="title">
                  <strong>{r.name}</strong>
                  <small>{recipeSummary(r)}</small>
                </div>
                <div className="meta">
                  {plannedIds.has(r.id) && <span className="pill gold">Planned</span>}
                  {!onlyThisMeal && <span className="pill muted">{r.meal === "Any" ? "Any time" : r.meal}</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
