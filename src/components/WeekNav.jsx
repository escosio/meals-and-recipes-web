import { addDays, startOfWeek, relativeWeekLabel } from "../lib/dates";

/** Page header with a title, a line of context, and previous / today / next week buttons. */
export default function WeekNav({ id, title, sub, weekStart, onChangeWeek }) {
  const isThisWeek = relativeWeekLabel(weekStart) === "This week";
  return (
    <header className="weeknav">
      <div>
        <h1 id={id}>{title}</h1>
        <p className="sub">{sub}</p>
      </div>
      <div className="controls">
        <button className="btn icon" onClick={() => onChangeWeek(addDays(weekStart, -7))} aria-label="Previous week">
          ‹
        </button>
        <button className="btn" onClick={() => onChangeWeek(startOfWeek(new Date()))} disabled={isThisWeek}>
          Today
        </button>
        <button className="btn icon" onClick={() => onChangeWeek(addDays(weekStart, 7))} aria-label="Next week">
          ›
        </button>
      </div>
    </header>
  );
}
