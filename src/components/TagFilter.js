import { TAGS } from "../lib/recipes";

/** Multi-select tag chips. Selected tags are combined, so "Kids" + "Quick" means both. */
export default function TagFilter({ selected, onChange }) {
  const toggle = (t) => onChange(selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t]);
  return (
    <div className="chips tags" role="group" aria-label="Filter by tag">
      {TAGS.map((t) => (
        <button key={t} className="chip tag" aria-pressed={selected.includes(t)} onClick={() => toggle(t)}>
          {t}
        </button>
      ))}
      {selected.length > 0 && (
        <button className="chip clear" onClick={() => onChange([])}>
          Clear
        </button>
      )}
    </div>
  );
}
