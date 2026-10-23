import { useCallback, useEffect, useMemo, useState } from "react";
import "./styles.css";
import WeekPlanner from "./components/WeekPlanner";
import RecipeLibrary from "./components/RecipeLibrary";
import RecipeDetail from "./components/RecipeDetail";
import RecipePicker from "./components/RecipePicker";
import ShoppingList from "./components/ShoppingList";
import RecipeForm from "./components/RecipeForm";
import RoutineSheet from "./components/RoutineSheet";
import SyncSheet, { statusLabel } from "./components/SyncSheet";
import { RecipesProvider } from "./lib/RecipesContext";
import { useHousehold } from "./hooks/useHousehold";
import { joinCodeFromUrl, clearJoinParam } from "./lib/api";
import { PLAN_MEALS, PRIMARY_MEAL, buildLibrary, randomRecipe, newRecipeId } from "./lib/recipes";
import { startOfWeek, weekDays, toISODate, weekdayShort, parseISODate } from "./lib/dates";
import { DEFAULT_ROUTINE, resolveSlot, toList, dowOf, dowName } from "./lib/plan";

const VIEWS = [
  { id: "plan", label: "Plan" },
  { id: "recipes", label: "Recipes" },
  { id: "shop", label: "Shop" },
];

export default function App() {
  const [view, setView] = useState("recipes");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  // Everything the household shares. Local-only until signed in and in a household.
  const household = useHousehold({ plan: {}, routine: DEFAULT_ROUTINE, checked: {}, extras: {}, recipes: [], favorites: [], hidden: [] });
  const { plan, routine, checked, extras, recipes: customRecipes, favorites: favoriteIds, hidden: hiddenIds } = household.data;
  const { update } = household;
  const setPlan = useCallback((v) => update("plan", v), [update]);
  const setRoutine = useCallback((v) => update("routine", v), [update]);
  const setChecked = useCallback((v) => update("checked", v), [update]);
  const setExtras = useCallback((v) => update("extras", v), [update]);
  const setCustomRecipes = useCallback((v) => update("recipes", v), [update]);
  const setFavoriteIds = useCallback((v) => update("favorites", v), [update]);
  const setHiddenIds = useCallback((v) => update("hidden", v), [update]);
  const [syncOpen, setSyncOpen] = useState(false);

  // Opening a share link (?join=CODE) joins that household once, then cleans the URL.
  // Signed out, it remembers the code and opens Sync to sign in.
  const { join: joinHousehold, code: currentCode } = household;
  useEffect(() => {
    const code = joinCodeFromUrl();
    if (!code) return;
    if (code === currentCode) {
      clearJoinParam();
      return;
    }
    joinHousehold(code)
      .then((result) => {
        if (result === "joined") {
          setToast("Joined the household. Your plans are now shared.");
          return;
        }
        setToast("Sign in with Google to join the household.");
        setSyncOpen(true);
      })
      .catch((err) => setToast(err.status === 404 ? "That share link doesn't match a household." : "Couldn't join right now. Try again from Sync."))
      .finally(clearJoinParam);
    // Run once on load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const toggleFavorite = useCallback(
    (id) => setFavoriteIds((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])),
    [setFavoriteIds],
  );
  const library = useMemo(() => buildLibrary(customRecipes, hiddenIds), [customRecipes, hiddenIds]);
  const { recipes, getRecipe } = library;
  const [editing, setEditing] = useState(null); // null | "new" | raw recipe being edited

  const getSlot = useCallback((dateKey, meal) => resolveSlot(plan, routine, dateKey, meal), [plan, routine]);

  const [detail, setDetail] = useState(null); // { recipeId, slot? }
  const [picker, setPicker] = useState(null); // { date, meal } for a night, { dow, meal } for the routine
  const [routineOpen, setRoutineOpen] = useState(false);
  const isRoutineSlot = (slot) => slot && slot.date === undefined;
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
        for (const id of getSlot(dayKey, meal).ids) {
          if (!map.has(id)) map.set(id, []);
          map.get(id).push(weekdayShort(d));
        }
      }
    }
    return map;
  }, [getSlot, weekStart]);
  const plannedIds = useMemo(() => new Set(plannedThisWeek.keys()), [plannedThisWeek]);

  // Write a slot's list for one week. An empty list is kept as an explicit
  // override when the routine would otherwise fill the night.
  const writeSlot = useCallback(
    (slot, ids) => {
      const routineIds = toList(routine[dowOf(slot.date)]?.[slot.meal]);
      setPlan((p) => {
        const day = { ...(p[slot.date] || {}) };
        const sameAsRoutine = ids.length === routineIds.length && ids.every((id, i) => id === routineIds[i]);
        if (sameAsRoutine || (ids.length === 0 && routineIds.length === 0)) delete day[slot.meal];
        else day[slot.meal] = ids;
        const next = { ...p };
        if (Object.keys(day).length) next[slot.date] = day;
        else delete next[slot.date];
        return next;
      });
    },
    [setPlan, routine],
  );

  // Write one meal of the weekly routine for a weekday.
  const writeRoutine = useCallback(
    (dow, meal, ids) => {
      setRoutine((r) => {
        const day = { ...(r[dow] || {}) };
        if (ids.length) day[meal] = ids;
        else delete day[meal];
        const next = { ...r };
        if (Object.keys(day).length) next[dow] = day;
        else delete next[dow];
        return next;
      });
    },
    [setRoutine],
  );

  // What's on a slot: a night's resolved list, or the routine for a weekday.
  const idsFor = useCallback(
    (slot, meal = slot.meal) => (isRoutineSlot(slot) ? toList(routine[slot.dow]?.[meal]) : getSlot(slot.date, meal).ids),
    [routine, getSlot],
  );

  const writeIds = useCallback(
    (slot, ids) => (isRoutineSlot(slot) ? writeRoutine(slot.dow, slot.meal, ids) : writeSlot(slot, ids)),
    [writeRoutine, writeSlot],
  );

  // Add a recipe to a slot (keeps whatever is already there).
  const assign = useCallback(
    (slot, recipeId) => {
      const ids = idsFor(slot);
      if (ids.includes(recipeId)) return;
      writeIds(slot, [...ids, recipeId]);
    },
    [idsFor, writeIds],
  );

  // Remove one recipe from a slot.
  const remove = useCallback((slot, recipeId) => writeIds(slot, idsFor(slot).filter((id) => id !== recipeId)), [idsFor, writeIds]);

  const setRepeat = (slot, recipeId, on) => {
    const dow = dowOf(slot.date);
    const ids = toList(routine[dow]?.[slot.meal]).filter((id) => id !== recipeId);
    writeRoutine(dow, slot.meal, on ? [...ids, recipeId] : ids);
    setToast(on ? `${getRecipe(recipeId).name} every ${dowName(dow)}` : `${getRecipe(recipeId).name} no longer repeats on ${dowName(dow)}s`);
    setDetail(null);
  };

  const closePicker = () => {
    const wasRoutine = isRoutineSlot(picker);
    setPicker(null);
    if (wasRoutine) setRoutineOpen(true);
  };

  const handlePick = (slot, recipeId) => {
    assign(slot, recipeId);
    const name = getRecipe(recipeId).name;
    if (isRoutineSlot(slot)) {
      setToast(`${name} every ${dowName(slot.dow)}`);
    } else {
      const day = weekdayShort(parseISODate(slot.date));
      setToast(`${name} added to ${day}${slot.meal === PRIMARY_MEAL ? "" : ` ${slot.meal.toLowerCase()}`}`);
    }
    closePicker();
  };

  const handleAssignFromDetail = (slot, recipeId) => {
    assign(slot, recipeId);
    setDetail(null);
    setToast(`Added to ${weekdayShort(parseISODate(slot.date))} ${slot.meal.toLowerCase()}`);
    setView("plan");
  };

  const fillEmptyDinners = () => {
    const used = new Set(plannedIds);
    setPlan((p) => {
      const next = { ...p };
      for (const d of weekDays(weekStart)) {
        const key = toISODate(d);
        if (resolveSlot(next, routine, key, PRIMARY_MEAL).ids.length) continue;
        const r = randomRecipe(recipes, PRIMARY_MEAL, used);
        if (!r) break;
        used.add(r.id);
        next[key] = { ...(next[key] || {}), [PRIMARY_MEAL]: [r.id] };
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
  }, [plannedIds, getRecipe]);

  const openFromPicker = (slot, recipeId) => {
    setPicker(null);
    // Routine slots have no single night, so the sheet opens in plain reading mode.
    setDetail({ recipeId, slot: isRoutineSlot(slot) ? undefined : slot });
  };

  const saveRecipe = (raw) => {
    const isNew = !raw.id;
    const entry = isNew ? { ...raw, id: newRecipeId(raw.mealName, recipes), custom: true } : { ...raw, custom: true };
    setCustomRecipes((list) => (isNew ? [...list, entry] : list.map((r) => (r.id === entry.id ? entry : r))));
    setEditing(null);
    setToast(isNew ? `${entry.mealName} added to the book` : `${entry.mealName} saved`);
    if (isNew) setDetail({ recipeId: entry.id });
  };

  // Custom recipes are deleted outright; built-ins are hidden and can be restored.
  const deleteRecipe = (id) => {
    const r = getRecipe(id);
    if (!r) return;
    if (r.custom) {
      if (!window.confirm(`Delete ${r.name}? This can't be undone.`)) return;
      setCustomRecipes((list) => list.filter((x) => x.id !== id));
      setToast(`${r.name} deleted`);
    } else {
      if (!window.confirm(`Remove ${r.name} from the book? You can bring it back from the bottom of the Recipes page.`)) return;
      setHiddenIds((list) => (list.includes(id) ? list : [...list, id]));
      setToast(`${r.name} removed from the book`);
    }
    setEditing(null);
    setDetail(null);
  };

  const restoreRecipe = (id) => {
    setHiddenIds((list) => list.filter((x) => x !== id));
    setToast(`${getRecipe(id)?.name || "Recipe"} is back in the book`);
  };

  return (
    <RecipesProvider value={library}>
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
            {household.status === "signed-out" ? "Sign in" : household.code ? "Shared" : "Sync"}
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
            onOpenSlot={setPicker}
            onFillEmpty={fillEmptyDinners}
            onClearWeek={clearWeek}
            onOpenRoutine={() => setRoutineOpen(true)}
          />
        )}
        {view === "recipes" && (
          <RecipeLibrary
            favorites={favorites}
            plannedThisWeek={plannedThisWeek}
            onOpenRecipe={(id) => setDetail({ recipeId: id })}
            onAddRecipe={() => setEditing("new")}
            onRestore={restoreRecipe}
          />
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
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onClose={() => setDetail(null)}
        onRepeat={setRepeat}
        onAssign={handleAssignFromDetail}
        onRemove={(slot, recipeId) => {
          remove(slot, recipeId);
          setDetail(null);
        }}
        onSwap={(slot) => {
          setDetail(null);
          setPicker(slot);
        }}
        onEdit={(recipe) => {
          setDetail(null);
          setEditing(recipe.raw);
        }}
        onDelete={deleteRecipe}
      />
      <RecipeForm
        open={!!editing}
        initial={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSave={saveRecipe}
        onDelete={deleteRecipe}
      />
      <SyncSheet
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        code={household.code}
        status={household.status}
        user={household.user}
        googleClientId={household.googleClientId}
        onSignIn={household.signIn}
        onSignOut={household.signOut}
        onCreate={household.create}
        onJoin={household.join}
        onLeave={household.leave}
        onToast={setToast}
      />
      <RoutineSheet
        open={routineOpen}
        routine={routine}
        onClose={() => setRoutineOpen(false)}
        onEdit={(slot) => {
          setRoutineOpen(false);
          setPicker(slot);
        }}
      />
      <RecipePicker
        open={!!picker}
        slot={picker}
        getIds={(meal) => (picker ? idsFor(picker, meal) : [])}
        plannedIds={plannedIds}
        favorites={favorites}
        onClose={closePicker}
        onChangeMeal={(meal) => setPicker((p) => (p ? { ...p, meal } : p))}
        onPick={handlePick}
        onRemove={remove}
        onReorder={writeIds}
        onOpenRecipe={openFromPicker}
      />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
    </RecipesProvider>
  );
}
