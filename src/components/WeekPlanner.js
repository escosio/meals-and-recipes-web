import { PLAN_MEALS, getRecipe } from "../lib/recipes";
import {
  weekDays,
  toISODate,
  isSameDay,
  weekdayShort,
  weekdayLong,
  formatWeekRange,
  relativeWeekLabel,
  startOfWeek,
  addDays,
} from "../lib/dates";

export default function WeekPlanner({ weekStart, onChangeWeek, getSlot, onOpenSlot, onFillEmpty, onClearWeek }) {
  const today = new Date();
  const days = weekDays(weekStart);
  const relative = relativeWeekLabel(weekStart);
  const meal = PLAN_MEALS[0];

  const filled = days.filter((d) => getSlot(toISODate(d), meal).id).length;

  return (
    <section aria-labelledby="plan-title">
      <header className="weeknav">
        <div>
          <h1 id="plan-title">{relative || formatWeekRange(weekStart)}</h1>
          <p className="sub">
            {relative ? `${formatWeekRange(weekStart)}. ` : ""}
            {filled === 0 ? "No dinners planned yet." : `${filled} of 7 dinners planned.`}
          </p>
        </div>
        <div className="controls">
          <button className="btn icon" onClick={() => onChangeWeek(addDays(weekStart, -7))} aria-label="Previous week">
            ‹
          </button>
          <button className="btn" onClick={() => onChangeWeek(startOfWeek(new Date()))} disabled={relative === "This week"}>
            Today
          </button>
          <button className="btn icon" onClick={() => onChangeWeek(addDays(weekStart, 7))} aria-label="Next week">
            ›
          </button>
        </div>
      </header>

      <div className="week">
        {days.map((d) => {
          const key = toISODate(d);
          const isToday = isSameDay(d, today);
          const isPast = !isToday && d < today;
          const { id, fromRoutine } = getSlot(key, meal);
          const recipe = getRecipe(id);
          const cls = recipe ? (recipe.isNote ? "slot note" : "slot") : "slot vacant";
          return (
            <div key={key} className={`day${isToday ? " today" : ""}${isPast ? " past" : ""}`}>
              <div className="day-head">
                <span className="num">{d.getDate()}</span>
                <span className="dow">{weekdayShort(d)}</span>
              </div>
              <button
                className={cls}
                onClick={() => onOpenSlot({ date: key, meal })}
                aria-label={`${weekdayLong(d)} dinner: ${recipe ? recipe.name : "nothing planned"}`}
              >
                <span className="name">{recipe ? recipe.name : "Add dinner"}</span>
                {recipe && (fromRoutine || (!recipe.isNote && !recipe.hasRecipe)) && (
                  <span className="flags">
                    {fromRoutine && <span className="flag">every week</span>}
                    {!recipe.isNote && !recipe.hasRecipe && <span className="flag">no recipe</span>}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="week-actions">
        <button className="btn" onClick={onFillEmpty} disabled={filled === 7}>
          Fill the empty nights for me
        </button>
        {filled > 0 && (
          <button className="btn danger" onClick={onClearWeek}>
            Clear week
          </button>
        )}
        <span className="hint">Tap a night to choose what to make.</span>
      </div>
    </section>
  );
}
