import { useCallback, useEffect, useMemo, useState } from "react";
import "./styles.css";
import WeekPlanner from "./components/WeekPlanner";
import RecipeLibrary from "./components/RecipeLibrary";
import RecipeDetail from "./components/RecipeDetail";
import RecipePicker from "./components/RecipePicker";
import ShoppingList from "./components/ShoppingList";
import SyncSheet, { statusLabel } from "./components/SyncSheet";
import { useHousehold } from "./hooks/useHousehold";
import { PLAN_MEALS, getRecipe, randomRecipe } from "./lib/recipes";
import { startOfWeek, weekDays, toISODate, weekdayShort } from "./lib/dates";
import { DEFAULT_ROUTINE, resolveSlot, dowOf, dowName } from "./lib/plan";

const VIEWS = [
  { id: "plan", label: "Plan" },
  { id: "recipes", label: "Recipes" },
  { id: "shop", label: "Shop" },
];

export default function App() {
  const [view, setView] = useState("plan");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const household = useHousehold({ plan: {}, routine: DEFAULT_ROUTINE, checked: {}, extras: {} });
  const { plan, routine, checked, extras } = household.data;
  const { update } = household;
  const setPlan = useCallback((v) => update("plan", v), [update]);
  const setRoutine = useCallback((v) => update("routine", v), [update]);
  const setChecked = useCallback((v) => update("checked", v), [update]);
  const setExtras = useCallback((v) => update("extras", v), [update]);
  const [syncOpen, setSyncOpen] = useState(false);

  const getSlot = useCallback((dateKey, meal) => resolveSlot(plan, routine, dateKey, meal), [plan, routine]);

  const [detail, setDetail] = useState(null); // { recipeId, slot? }
  const [picker, setPicker] = useState(null); // { date, meal }
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Recipe id -> list of day names it's planned on, for the week being viewed.
  const plannedThisWeek = useMemo(() => {
    const map = new Map();
    for (const d of weekDays(weekStart)) {
      const dayKey = toISODate(d);
      for (const meal of PLAN_MEALS) {
        const { id } = resolveSlot(plan, routine, dayKey, meal);
        if (!id) continue;
        if (!map.has(id)) map.set(id, []);
        map.get(id).push(weekdayShort(d));
      }
    }
    return map;
  }, [plan, routine, weekStart]);
  const plannedIds = useMemo(() => new Set(plannedThisWeek.keys()), [plannedThisWeek]);

  const assign = useCallback(
    (slot, recipeId) => {
      setPlan((p) => ({ ...p, [slot.date]: { ...(p[slot.date] || {}), [slot.meal]: recipeId } }));
    },
    [setPlan],
  );

  const remove = useCallback(
    (slot) => {
      const routineId = routine[dowOf(slot.date)]?.[slot.meal];
      setPlan((p) => {
        const day = { ...(p[slot.date] || {}) };
        // Keep an explicit null so the routine doesn't refill it this week.
        if (routineId) day[slot.meal] = null;
        else delete day[slot.meal];
        const next = { ...p };
        if (Object.keys(day).length) next[slot.date] = day;
        else delete next[slot.date];
        return next;
      });
    },
    [setPlan, routine],
  );

  const setRepeat = (slot, recipeId) => {
    const dow = dowOf(slot.date);
    setRoutine((r) => {
      const day = { ...(r[dow] || {}) };
      if (recipeId) day[slot.meal] = recipeId;
      else delete day[slot.meal];
      const next = { ...r };
      if (Object.keys(day).length) next[dow] = day;
      else delete next[dow];
      return next;
    });
    if (recipeId) {
      // The week's own entry is now redundant; let the routine supply it.
      setPlan((p) => {
        const day = { ...(p[slot.date] || {}) };
        if (day[slot.meal] === recipeId) delete day[slot.meal];
        const next = { ...p };
        if (Object.keys(day).length) next[slot.date] = day;
        else delete next[slot.date];
        return next;
      });
      setToast(`${getRecipe(recipeId).name} every ${dowName(dow)}`);
    } else {
      setToast(`No longer repeats on ${dowName(dow)}s`);
    }
    setDetail(null);
  };

  const openSlot = (slot) => {
    const current = getSlot(slot.date, slot.meal).id;
    if (current && getRecipe(current)) setDetail({ recipeId: current, slot });
    else setPicker(slot);
  };

  const handlePick = (slot, recipeId) => {
    assign(slot, recipeId);
    setPicker(null);
    setToast(`${getRecipe(recipeId).name} added to ${weekdayShort(new Date(slot.date + "T00:00"))}`);
  };

  const handleAssignFromDetail = (slot, recipeId) => {
    assign(slot, recipeId);
    setDetail(null);
    setToast(`Added to ${weekdayShort(new Date(slot.date + "T00:00"))} ${slot.meal.toLowerCase()}`);
    setView("plan");
  };

  const fillEmptyDinners = () => {
    const used = new Set(plannedIds);
    setPlan((p) => {
      const next = { ...p };
      for (const d of weekDays(weekStart)) {
        const key = toISODate(d);
        if (resolveSlot(next, routine, key, "Dinner").id) continue;
        const r = randomRecipe("Dinner", used);
        if (!r) break;
        used.add(r.id);
        next[key] = { ...(next[key] || {}), Dinner: r.id };
      }
      return next;
    });
    setToast("Dinners filled. Tap any to swap it.");
  };

  const clearWeek = () => {
    if (!window.confirm("Clear every meal this week?")) return;
    setPlan((p) => {
      const next = { ...p };
      for (const d of weekDays(weekStart)) delete next[toISODate(d)];
      return next;
    });
  };

  const toggleChecked = (weekKey, key) =>
    setChecked((c) => {
      const week = { ...(c[weekKey] || {}) };
      if (week[key]) delete week[key];
      else week[key] = true;
      return { ...c, [weekKey]: week };
    });

  const clearChecked = (weekKey) => setChecked((c) => ({ ...c, [weekKey]: {} }));

  const addExtra = (weekKey, text) =>
    setExtras((e) => ({ ...e, [weekKey]: [...(e[weekKey] || []), { id: Date.now().toString(36), text }] }));

  const removeExtra = (weekKey, id) =>
    setExtras((e) => ({ ...e, [weekKey]: (e[weekKey] || []).filter((x) => x.id !== id) }));

  const shopCount = useMemo(() => {
    let n = 0;
    for (const id of plannedIds) {
      const r = getRecipe(id);
      if (r && !r.isNote) n += r.ingredients.length;
    }
    return n;
  }, [plannedIds]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-row">
          <div className="brand">
            Meals <span>&amp; Recipes</span>
          </div>
          <button
            className={`sync-pill ${household.status}`}
            onClick={() => setSyncOpen(true)}
            title={statusLabel(household.status)}
            aria-label={`Sync: ${statusLabel(household.status)}`}
          >
            <span className="dot" aria-hidden="true" />
            {household.code ? "Shared" : "Sync"}
          </button>
        </div>
        <nav className="tabs" aria-label="Sections">
          {VIEWS.map((v) => (
            <button key={v.id} className="tab" aria-current={view === v.id ? "page" : undefined} onClick={() => setView(v.id)}>
              {v.label}
              {v.id === "shop" && shopCount > 0 && <span className="count">{shopCount}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="view">
        {view === "plan" && (
          <WeekPlanner
            weekStart={weekStart}
            onChangeWeek={setWeekStart}
            getSlot={getSlot}
            onOpenSlot={openSlot}
            onFillEmpty={fillEmptyDinners}
            onClearWeek={clearWeek}
          />
        )}
        {view === "recipes" && (
          <RecipeLibrary plannedThisWeek={plannedThisWeek} onOpenRecipe={(id) => setDetail({ recipeId: id })} />
        )}
        {view === "shop" && (
          <ShoppingList
            weekStart={weekStart}
            onChangeWeek={setWeekStart}
            getSlot={getSlot}
            checked={checked}
            onToggle={toggleChecked}
            extras={extras}
            onAddExtra={addExtra}
            onRemoveExtra={removeExtra}
            onClearChecked={clearChecked}
            onToast={setToast}
          />
        )}
      </main>

      <RecipeDetail
        open={!!detail}
        recipeId={detail?.recipeId}
        slot={detail?.slot}
        weekStart={weekStart}
        getSlot={getSlot}
        routine={routine}
        onClose={() => setDetail(null)}
        onRepeat={setRepeat}
        onAssign={handleAssignFromDetail}
        onRemove={(slot) => {
          remove(slot);
          setDetail(null);
        }}
        onSwap={(slot) => {
          setDetail(null);
          setPicker(slot);
        }}
      />
      <SyncSheet
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        code={household.code}
        status={household.status}
        onJoin={household.join}
        onLeave={household.leave}
        onToast={setToast}
      />
      <RecipePicker open={!!picker} slot={picker} plannedIds={plannedIds} onClose={() => setPicker(null)} onPick={handlePick} />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
