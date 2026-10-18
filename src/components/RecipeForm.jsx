import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import { FORM_MEALS, PRIMARY_MEAL, TAGS } from "../lib/recipes";

const EMPTY = { mealName: "", meal: PRIMARY_MEAL, tags: [], ingredient: "", instructions: "", link: "" };

/**
 * Add or edit a recipe you've written yourself. Saves the same raw shape as
 * the entries in recipes.ts (plus id and custom: true).
 */
export default function RecipeForm({ open, initial, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
  }, [open, initial]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleTag = (t) =>
    setForm((f) => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] }));

  const canSave = form.mealName.trim().length > 0;
  const submit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      ...form,
      mealName: form.mealName.trim(),
      ingredient: form.ingredient.trim(),
      instructions: form.instructions.trim(),
      link: form.link.trim(),
    });
  };

  const isEdit = Boolean(initial?.id);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit recipe" : "New recipe"}
      subtitle={isEdit ? initial.mealName : "Add something to the book"}
      footer={
        <>
          {isEdit && (
            <button className="btn danger" onClick={() => onDelete(initial.id)}>
              Delete
            </button>
          )}
          <span className="spacer" />
          <button className="btn primary" type="submit" form="recipe-form" disabled={!canSave}>
            {isEdit ? "Save changes" : "Add to book"}
          </button>
        </>
      }
    >
      <form id="recipe-form" className="recipe-form" onSubmit={submit}>
        <label className="field">
          <span>Name</span>
          <input value={form.mealName} onChange={set("mealName")} placeholder="Arroz con pollo" autoFocus required />
        </label>

        <div className="field">
          <span>Meal</span>
          <div className="chips" role="group" aria-label="Meal">
            {FORM_MEALS.map((m) => (
              <button
                type="button"
                key={m}
                className="chip"
                aria-pressed={form.meal === m}
                onClick={() => setForm((f) => ({ ...f, meal: m }))}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>Tags</span>
          <div className="chips" role="group" aria-label="Tags">
            {TAGS.map((t) => (
              <button type="button" key={t} className="chip tag" aria-pressed={form.tags.includes(t)} onClick={() => toggleTag(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>Ingredients, one per line</span>
          <textarea
            value={form.ingredient}
            onChange={set("ingredient")}
            rows={6}
            placeholder={"1 lb chicken thighs\n2 cups rice\n1/3 cup sofrito"}
          />
        </label>

        <label className="field">
          <span>Steps, one per line</span>
          <textarea
            value={form.instructions}
            onChange={set("instructions")}
            rows={6}
            placeholder={"Brown the chicken.\nAdd sofrito and rice.\nSimmer 25 minutes."}
          />
        </label>

        <label className="field">
          <span>Link to the original, optional</span>
          <input type="url" value={form.link} onChange={set("link")} placeholder="https://" inputMode="url" />
        </label>
      </form>
    </Sheet>
  );
}
