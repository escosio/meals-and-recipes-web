import { useEffect, useMemo, useRef, useState } from "react";
import Sheet from "./Sheet";
import { QUICK_OPTIONS, SIDE, PLAN_MEALS, PRIMARY_MEAL, fitsMeal, isMainFor, searchRecipes, filterByTags, splitFavorites, randomRecipe, recipeSummary, noteId, mealLabel } from "../lib/recipes";
import { useRecipes } from "../lib/RecipesContext";
import TagFilter from "./TagFilter";
import { weekdayLong } from "../lib/dates";

export default function RecipePicker({ open, slot, current, plannedIds, favorites, onClose, onChangeMeal, onPick, onRemove, onReorder, onOpenRecipe }) {
  const { recipes, getRecipe } = useRecipes();
  const [query, setQuery] = useState("");
  const [onlyThisMeal, setOnlyThisMeal] = useState(true);
  const [sidesOnly, setSidesOnly] = useState(false);
  const [tags, setTags] = useState([]);
  const [dragging, setDragging] = useState(null); // id being dragged
  const [over, setOver] = useState(null); // id being hovered
  const dragId = useRef(null);

  // Reset the search when the sheet opens or the meal changes, but not on every re-render of the slot.
  const slotKey = slot ? `${slot.date}:${slot.meal}` : "";
  useEffect(() => {
    if (open) {
      setQuery("");
      setOnlyThisMeal(true);
      setSidesOnly(false);
      setTags([]);
    }
  }, [open, slotKey]);

  const list = useMemo(() => {
    if (!slot) return [];
    let base = onlyThisMeal ? recipes.filter((r) => fitsMeal(r, slot.meal)) : recipes;
    if (sidesOnly) base = base.filter((r) => r.meal === SIDE);
    return searchRecipes(filterByTags(base, tags), query);
  }, [slot, query, onlyThisMeal, sidesOnly, tags, recipes]);

  const [favList, restList] = useMemo(() => splitFavorites(list, favorites), [list, favorites]);

  if (!slot) return <Sheet open={false} onClose={onClose} title="" />;

  const dayName = weekdayLong(new Date(slot.date + "T00:00"));
  const tonight = (current?.ids || []).map(getRecipe).filter(Boolean);
  const onSlot = new Set(tonight.map((r) => r.id));
  const ids = tonight.map((r) => r.id);

  const move = (id, to) => {
    const from = ids.indexOf(id);
    if (from < 0 || to < 0 || to >= ids.length || to === from) return;
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, id);
    onReorder(slot, next);
  };

  const dropOn = (targetId) => {
    const id = dragId.current;
    dragId.current = null;
    setDragging(null);
    setOver(null);
    if (!id || id === targetId) return;
    move(id, ids.indexOf(targetId));
  };
  const pickRandom = () => {
    // Respect the tag filter so "Pick for me" with Kids on picks a kid dinner.
    const pool = list.filter((r) => isMainFor(r, slot.meal) && r.hasRecipe && !plannedIds.has(r.id));
    const from = pool.length ? pool : list;
    const r = from.length ? from[Math.floor(Math.random() * from.length)] : randomRecipe(recipes, slot.meal, plannedIds);
    if (r) onPick(slot, r.id);
  };

  const renderRows = (items) => (
    <>
          {items.map((r) => (
            <li key={r.id}>
              <button className="row" onClick={() => onPick(slot, r.id)}>
                <div className="title">
                  <strong>
                    {favorites?.has(r.id) && <span className="fav" aria-hidden="true">★ </span>}
                    {r.name}
                  </strong>
                  <small>{recipeSummary(r)}</small>
                </div>
                <div className="meta">
                  {onSlot.has(r.id) ? (
                    <span className="pill">Tonight</span>
                  ) : (
                    plannedIds.has(r.id) && <span className="pill gold">Planned</span>
                  )}
                  {(!onlyThisMeal || r.meal === SIDE) && !sidesOnly && <span className="pill muted">{mealLabel(r.meal)}</span>}
                </div>
              </button>
            </li>
          ))}
    </>
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`${dayName} ${slot.meal.toLowerCase()}`}
      subtitle={tonight.length ? "Tap a dish to read it, or add another" : "Choose what to make"}
    >
      <div className="meal-switch" role="tablist" aria-label="Meal">
        {PLAN_MEALS.map((m) => (
          <button
            key={m}
            role="tab"
            className="meal-tab"
            aria-selected={slot.meal === m}
            onClick={() => onChangeMeal(m)}
          >
            {m}
            {m !== PRIMARY_MEAL && current?.others?.[m] > 0 && <span className="count">{current.others[m]}</span>}
          </button>
        ))}
      </div>
      {tonight.length > 0 && (
        <ul className="tonight" aria-label="Already planned">
          {tonight.map((r, i) => (
            <li
              key={r.id}
              className={[r.isNote ? "note" : "", dragging === r.id ? "dragging" : "", over === r.id && dragging !== r.id ? "over" : ""]
                .filter(Boolean)
                .join(" ")}
              draggable={tonight.length > 1}
              onDragStart={(e) => {
                dragId.current = r.id;
                setDragging(r.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", r.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (over !== r.id) setOver(r.id);
              }}
              onDragLeave={() => over === r.id && setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                dropOn(r.id);
              }}
              onDragEnd={() => {
                dragId.current = null;
                setDragging(null);
                setOver(null);
              }}
            >
              {tonight.length > 1 && (
                <span className="grip" aria-hidden="true">
                  ⋮⋮
                </span>
              )}
              <button className="tonight-name" onClick={() => onOpenRecipe(slot, r.id)}>
                {r.name}
              </button>
              {tonight.length > 1 && (
                <span className="order-btns">
                  <button className="btn icon quiet" aria-label={`Move ${r.name} up`} disabled={i === 0} onClick={() => move(r.id, i - 1)}>
                    ↑
                  </button>
                  <button
                    className="btn icon quiet"
                    aria-label={`Move ${r.name} down`}
                    disabled={i === tonight.length - 1}
                    onClick={() => move(r.id, i + 1)}
                  >
                    ↓
                  </button>
                </span>
              )}
              <button className="btn icon quiet" aria-label={`Remove ${r.name}`} onClick={() => onRemove(slot, r.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
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
        <button className="chip" aria-pressed={sidesOnly} onClick={() => setSidesOnly((v) => !v)}>
          Sides
        </button>
        <button className="chip" aria-pressed={!onlyThisMeal} onClick={() => setOnlyThisMeal((v) => !v)}>
          {onlyThisMeal ? `Only ${slot.meal.toLowerCase()} recipes` : "All recipes"}
        </button>
        <TagFilter selected={tags} onChange={setTags} />
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
        <>
          {favList.length > 0 && (
            <>
              <h3 className="group-head">Favorites</h3>
              <ul className="picker-list list">{renderRows(favList)}</ul>
            </>
          )}
          {restList.length > 0 && (
            <>
              {favList.length > 0 && <h3 className="group-head">Everything else</h3>}
              <ul className="picker-list list">{renderRows(restList)}</ul>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}
