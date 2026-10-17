import { useState } from "react";
import Sheet from "./Sheet";
import { PLAN_MEALS, getRecipe, linkify, hostOf } from "../lib/recipes";
import { weekDays, toISODate, weekdayShort } from "../lib/dates";
import { dowOf, dowName } from "../lib/plan";

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

export default function RecipeDetail({ open, recipeId, slot, weekStart, getSlot, routine, onClose, onAssign, onRemove, onRepeat, onSwap }) {
  const recipe = getRecipe(recipeId);
  const [checked, setChecked] = useState({});
  const [picking, setPicking] = useState(false);

  if (!recipe) return <Sheet open={false} onClose={onClose} title="" />;

  const toggle = (i) => setChecked((c) => ({ ...c, [i]: !c[i] }));
  const repeats = slot ? routine[dowOf(slot.date)]?.[slot.meal] === recipe.id : false;
  const dayLabel = slot ? dowName(dowOf(slot.date)) : "";
  const subtitle = recipe.isNote ? "Not a recipe" : recipe.meal === "Any" ? "Any time" : recipe.meal;

  const handleClose = () => {
    setChecked({});
    setPicking(false);
    onClose();
  };

  const footer = slot ? (
    <>
      <button className="btn danger" onClick={() => onRemove(slot)}>
        Remove from {weekdayShort(new Date(slot.date + "T00:00"))}
      </button>
      <button className="btn quiet" onClick={() => onRepeat(slot, repeats ? null : recipe.id)}>
        {repeats ? `Stop repeating on ${dayLabel}s` : `Repeat every ${dayLabel}`}
      </button>
      <span className="spacer" />
      <button className="btn primary" onClick={() => onSwap(slot)}>
        Swap recipe
      </button>
    </>
  ) : (
    <>
      <span className="spacer" />
      <button className="btn primary" onClick={() => setPicking((p) => !p)}>
        {picking ? "Back to recipe" : "Add to a dinner this week"}
      </button>
    </>
  );

  return (
    <Sheet open={open} onClose={handleClose} title={recipe.name} subtitle={subtitle} footer={footer}>
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
            {PLAN_MEALS.map((meal) => {
              const current = getRecipe(getSlot(key, meal).id);
              const fits = recipe.meal === "Any" || recipe.meal === meal;
              return (
                <button
                  key={meal}
                  className={`dp-slot${current ? " filled" : ""}`}
                  onClick={() => onPick({ date: key, meal })}
                  title={current ? `Replace ${current.name}` : `Add to ${meal}`}
                  style={fits ? undefined : { opacity: 0.5 }}
                >
                  {current ? `Replace ${current.name}` : "Add here"}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
