import { useState } from "react";
import { TAGS } from "../lib/recipes";

function FunnelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 3h12l-4.5 5.5V13l-3 1.5V8.5L2 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Tag filter hidden behind a funnel button. Selected tags combine, so
 * "Kids" + "Quick" means both. Shows a count on the button when collapsed.
 */
export default function TagFilter({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const toggle = (t) => onChange(selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t]);

  return (
    <>
      <button
        className="btn filter-toggle"
        aria-expanded={open}
        aria-controls="tag-filters"
        aria-pressed={selected.length > 0}
        onClick={() => setOpen((v) => !v)}
        title="Filter by tag"
      >
        <FunnelIcon />
        <span className="filter-label">Filters</span>
        {selected.length > 0 && <span className="badge">{selected.length}</span>}
      </button>
      {open && (
        <div id="tag-filters" className="chips tags" role="group" aria-label="Filter by tag">
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
      )}
    </>
  );
}
