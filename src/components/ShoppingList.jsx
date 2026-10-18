import { useMemo, useState } from "react";
import { PLAN_MEALS } from "../lib/recipes";
import { useRecipes } from "../lib/RecipesContext";
import { weekDays, toISODate, weekdayShort, formatWeekRange, relativeWeekLabel, addDays, startOfWeek } from "../lib/dates";

export default function ShoppingList({ weekStart, onChangeWeek, getSlot, checked, onToggle, extras, onAddExtra, onRemoveExtra, onClearChecked, onToast }) {
  const { getRecipe } = useRecipes();
  const [text, setText] = useState("");
  const [hideDone, setHideDone] = useState(false);
  const weekKey = toISODate(weekStart);
  const relative = relativeWeekLabel(weekStart);

  // Group planned recipes for the week, remembering which days they appear on.
  const groups = useMemo(() => {
    const map = new Map();
    for (const d of weekDays(weekStart)) {
      const key = toISODate(d);
      for (const meal of PLAN_MEALS) {
        for (const id of getSlot(key, meal).ids) {
          const r = getRecipe(id);
          if (!r || r.isNote || r.ingredients.length === 0) continue;
          if (!map.has(r.id)) map.set(r.id, { recipe: r, days: [] });
          map.get(r.id).days.push(weekdayShort(d));
        }
      }
    }
    return Array.from(map.values());
  }, [getSlot, weekStart, getRecipe]);

  const weekChecked = checked[weekKey] || {};
  const weekExtras = extras[weekKey] || [];

  const total = groups.reduce((n, g) => n + g.recipe.ingredients.length, 0) + weekExtras.length;
  const done =
    groups.reduce((n, g) => n + g.recipe.ingredients.filter((_, i) => weekChecked[`${g.recipe.id}:${i}`]).length, 0) +
    weekExtras.filter((e) => weekChecked[`extra:${e.id}`]).length;

  const submitExtra = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onAddExtra(weekKey, t);
    setText("");
  };

  const copyList = async () => {
    const lines = [];
    for (const g of groups) {
      lines.push(g.recipe.name);
      g.recipe.ingredients.forEach((ing, i) => {
        if (!weekChecked[`${g.recipe.id}:${i}`]) lines.push(`  - ${ing}`);
      });
    }
    const openExtras = weekExtras.filter((e) => !weekChecked[`extra:${e.id}`]);
    if (openExtras.length) {
      lines.push("Other");
      openExtras.forEach((e) => lines.push(`  - ${e.text}`));
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      onToast("List copied");
    } catch {
      onToast("Couldn't copy. Select the list and copy it by hand.");
    }
  };

  return (
    <section aria-labelledby="shop-title">
      <header className="weeknav">
        <div>
          <h1 id="shop-title">Shopping list</h1>
          <p className="sub">
            {relative ? `${relative}, ` : ""}
            {formatWeekRange(weekStart)}. Built from the meals you planned.
          </p>
        </div>
        <div className="controls">
          <button className="btn icon" onClick={() => onChangeWeek(addDays(weekStart, -7))} aria-label="Previous week">‹</button>
          <button className="btn" onClick={() => onChangeWeek(startOfWeek(new Date()))} disabled={relative === "This week"}>Today</button>
          <button className="btn icon" onClick={() => onChangeWeek(addDays(weekStart, 7))} aria-label="Next week">›</button>
        </div>
      </header>

      {total > 0 && (
        <div className="shop-summary">
          <div className="progress" aria-hidden="true">
            <div style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <span className="hint" style={{ color: "var(--muted)", fontSize: 14 }}>
            {done} of {total} in the cart
          </span>
          <div className="controls">
            <button className="btn" onClick={() => setHideDone((v) => !v)}>{hideDone ? "Show checked" : "Hide checked"}</button>
            <button className="btn" onClick={copyList}>Copy list</button>
            {done > 0 && <button className="btn danger" onClick={() => onClearChecked(weekKey)}>Uncheck all</button>}
          </div>
        </div>
      )}

      {groups.length === 0 && weekExtras.length === 0 && (
        <div className="empty">
          <strong>Nothing to buy yet</strong>
          Plan some meals and their ingredients will show up here.
        </div>
      )}

      {groups.map(({ recipe, days }) => {
        const items = recipe.ingredients
          .map((ing, i) => ({ ing, key: `${recipe.id}:${i}` }))
          .filter(({ key }) => !hideDone || !weekChecked[key]);
        if (items.length === 0) return null;
        return (
          <div className="shop-group" key={recipe.id}>
            <h2>
              {recipe.name} <small>{days.join(", ")}</small>
            </h2>
            <ul className="checklist">
              {items.map(({ ing, key }) => (
                <li key={key}>
                  <label>
                    <input type="checkbox" checked={!!weekChecked[key]} onChange={() => onToggle(weekKey, key)} />
                    <span>{ing}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <div className="shop-group">
        <h2>Other items <small>staples, snacks, anything else</small></h2>
        <ul className="checklist">
          {weekExtras
            .filter((e) => !hideDone || !weekChecked[`extra:${e.id}`])
            .map((e) => (
              <li key={e.id}>
                <label>
                  <input type="checkbox" checked={!!weekChecked[`extra:${e.id}`]} onChange={() => onToggle(weekKey, `extra:${e.id}`)} />
                  <span>{e.text}</span>
                  <span className="spacer" style={{ flex: 1 }} />
                  <button className="btn icon quiet" style={{ minHeight: 28, width: 28, fontSize: 16 }} aria-label={`Remove ${e.text}`} onClick={(ev) => { ev.preventDefault(); onRemoveExtra(weekKey, e.id); }}>×</button>
                </label>
              </li>
            ))}
        </ul>
        <form className="add-item" onSubmit={submitExtra}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an item" aria-label="Add an item" />
          <button className="btn" type="submit" disabled={!text.trim()}>Add</button>
        </form>
      </div>
    </section>
  );
}
