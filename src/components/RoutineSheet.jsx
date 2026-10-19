import Sheet from "./Sheet";
import { PRIMARY_MEAL, EXTRA_MEALS } from "../lib/recipes";
import { useRecipes } from "../lib/RecipesContext";
import { DOWS, dowName, toList } from "../lib/plan";

/**
 * The household's weekly routine: what repeats on each weekday. Tapping a
 * meal opens the normal picker in routine mode.
 */
export default function RoutineSheet({ open, routine, onClose, onEdit }) {
  const { getRecipe } = useRecipes();
  if (!open) return null;
  const anySet = DOWS.some((dow) => Object.keys(routine[dow] || {}).length > 0);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Weekly routine"
      subtitle="Meals that repeat every week. You can still change any single week."
    >
      {!anySet && <p className="notice">Nothing repeats yet. Tap a day to set what you always make.</p>}
      <ul className="routine">
        {DOWS.map((dow) => {
          const day = routine[dow] || {};
          const dinner = toList(day[PRIMARY_MEAL]).map(getRecipe).filter(Boolean);
          const extras = EXTRA_MEALS.map((meal) => ({ meal, items: toList(day[meal]).map(getRecipe).filter(Boolean) })).filter(
            (e) => e.items.length > 0,
          );
          return (
            <li key={dow} className="routine-day">
              <div className="routine-dow">{dowName(dow)}</div>
              <div className="routine-meals">
                <button
                  className={`routine-slot${dinner.length ? "" : " vacant"}`}
                  onClick={() => onEdit({ dow, meal: PRIMARY_MEAL })}
                  aria-label={`${dowName(dow)} dinner routine: ${dinner.length ? dinner.map((r) => r.name).join(" and ") : "nothing"}`}
                >
                  {dinner.length ? dinner.map((r) => r.name).join(", ") : "Add a dinner"}
                </button>
                {extras.map(({ meal, items }) => (
                  <button
                    key={meal}
                    className="routine-slot extra"
                    onClick={() => onEdit({ dow, meal })}
                    aria-label={`${dowName(dow)} ${meal.toLowerCase()} routine: ${items.map((r) => r.name).join(" and ")}`}
                  >
                    <span className="extra-meal">{meal}</span> {items.map((r) => r.name).join(", ")}
                  </button>
                ))}
                {extras.length < EXTRA_MEALS.length && (
                  <button
                    className="routine-add-extra"
                    onClick={() => onEdit({ dow, meal: EXTRA_MEALS.find((m) => !extras.some((e) => e.meal === m)) })}
                  >
                    + lunch or breakfast
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
