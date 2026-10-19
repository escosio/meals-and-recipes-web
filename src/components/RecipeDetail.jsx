import { useState } from "react";
import Sheet from "./Sheet";
import { PLAN_MEALS, PRIMARY_MEAL, fitsMeal, linkify, hostOf, mealLabel } from "../lib/recipes";
import { useRecipes } from "../lib/RecipesContext";
import { weekDays, toISODate, weekdayShort, parseISODate } from "../lib/dates";
import { dowOf, dowName, toList } from "../lib/plan";

function Text({ text }) {
  return linkify(text).map((part, i) =>
    typeof part === "string" ? (
      part
    ) : (
      <a key={i} href={part.url} target="_blank" rel="noreferrer">
        {hostOf(part.url)}
      </a>
    ),
  );
}

export default function RecipeDetail({ open, recipeId, slot, weekStart, getSlot, routine, favorites, onToggleFavorite, onClose, onAssign, onRemove, onRepeat, onSwap, onEdit, onDelete }) {
  const { getRecipe } = useRecipes();
  const recipe = getRecipe(recipeId);
  const [checked, setChecked] = useState({});
  const [picking, setPicking] = useState(false);

  if (!recipe) return null;

  const toggle = (i) => setChecked((c) => ({ ...c, [i]: !c[i] }));
  const repeats = slot ? toList(routine[dowOf(slot.date)]?.[slot.meal]).includes(recipe.id) : false;
  const dayLabel = slot ? dowName(dowOf(slot.date)) : "";
  const mealText = mealLabel(recipe.meal);
  const subtitle = recipe.isNote ? "Not a recipe" : recipe.custom ? `${mealText}. Added by you.` : mealText;

  const handleClose = () => {
    setChecked({});
    setPicking(false);
    onClose();
  };

  const footer = slot ? (
    <>
      <button className="btn danger" onClick={() => onRemove(slot, recipe.id)}>
        Remove from {weekdayShort(parseISODate(slot.date))}
      </button>
      <button className="btn quiet" onClick={() => onRepeat(slot, recipe.id, !repeats)}>
        {repeats ? `Stop repeating on ${dayLabel}s` : `Repeat every ${dayLabel}`}
      </button>
      <span className="spacer" />
      <button className="btn primary" onClick={() => onSwap(slot)}>
        Add or swap
      </button>
    </>
  ) : (
    <>
      {!recipe.isNote && (
        <button className="btn danger" onClick={() => onDelete(recipe.id)}>
          {recipe.custom ? "Delete" : "Remove from book"}
        </button>
      )}
      {recipe.custom && (
        <button className="btn quiet" onClick={() => onEdit(recipe)}>
          Edit
        </button>
      )}
      <span className="spacer" />
      <button className="btn primary" onClick={() => setPicking((p) => !p)}>
        {picking ? "Back to recipe" : "Add to a dinner this week"}
      </button>
    </>
  );

  const isFav = favorites.has(recipe.id);
  const star = !recipe.isNote && (
    <button
      className={`btn icon quiet star${isFav ? " on" : ""}`}
      aria-pressed={isFav}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      title={isFav ? "Favorite" : "Add to favorites"}
      onClick={() => onToggleFavorite(recipe.id)}
    >
      {isFav ? "★" : "☆"}
    </button>
  );

  return (
    <Sheet open={open} onClose={handleClose} title={recipe.name} subtitle={subtitle} footer={footer} headAction={star}>
      {picking ? (
        <DayPicker recipe={recipe} weekStart={weekStart} getSlot={getSlot} onPick={(s) => onAssign(s, recipe.id)} />
      ) : (
        <div className="detail">
          {repeats && <p className="notice">On the plan every {dayLabel}. Remove it from one week without affecting the others.</p>}
          {recipe.isNote ? (
            <p className="notice">A placeholder for the plan. Nothing to shop for.</p>
          ) : !recipe.hasRecipe ? (
            <p className="notice">No ingredients or steps written down for this one yet.</p>
          ) : (
            <>
              {recipe.ingredients.length > 0 && (
                <>
                  <h3>Ingredients</h3>
                  <ul className="checklist">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i}>
                        <label>
                          <input type="checkbox" checked={!!checked[i]} onChange={() => toggle(i)} />
                          <span><Text text={ing} /></span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {recipe.steps.length > 0 && (
                <>
                  <h3>Steps</h3>
                  <ol className="steps">
                    {recipe.steps.map((s, i) => (
                      <li key={i}><Text text={s} /></li>
                    ))}
                  </ol>
                </>
              )}
              {recipe.links.length > 0 && (
                <>
                  <h3>Source</h3>
                  <div className="links">
                    {recipe.links.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        {url}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

function DayPicker({ recipe, weekStart, getSlot, onPick }) {
  const { getRecipe } = useRecipes();
  const days = weekDays(weekStart);
  return (
    <div className="day-picker" role="group" aria-label="Choose a day and meal">
      {days.map((d) => {
        const key = toISODate(d);
        return (
          <div className="dp-row" key={key}>
            <div className="dp-day">
              {weekdayShort(d)} <small>{d.getDate()}</small>
            </div>
            <div className="dp-meals">
              {PLAN_MEALS.filter((meal) => fitsMeal(recipe, meal) || meal === PRIMARY_MEAL).map((meal) => {
                const current = getSlot(key, meal).ids.map(getRecipe).filter(Boolean);
                const already = current.some((r) => r.id === recipe.id);
                return (
                  <button
                    key={meal}
                    className={`dp-slot${current.length ? " filled" : ""}`}
                    onClick={() => onPick({ date: key, meal })}
                    disabled={already}
                    title={current.length ? `With ${current.map((r) => r.name).join(", ")}` : `Add to ${meal.toLowerCase()}`}
                  >
                    {already ? `On ${meal.toLowerCase()}` : current.length ? `${meal} + ` : meal}
                    {!already && current.length > 0 && <span className="dp-with">{current.map((r) => r.name).join(", ")}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
