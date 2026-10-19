import { useEffect, useRef } from "react";

function closeDialog(el) {
  if (typeof el.close === "function") {
    el.close();
  } else {
    el.removeAttribute("open");
    el.dispatchEvent(new Event("close"));
  }
}

/**
 * Bottom sheet on phones, centred dialog on larger screens.
 * Built on the native <dialog> so Escape, focus trapping and the backdrop come free.
 */
export default function Sheet({ open, onClose, title, subtitle, children, footer, headAction }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      // Browsers without the dialog API just get the open attribute; the CSS
      // overlay works either way, only focus trapping is lost.
      if (typeof el.showModal === "function") el.showModal();
      else el.setAttribute("open", "");
      const body = el.querySelector(".sheet-body");
      if (body) body.scrollTop = 0;
    }
    if (!open && el.open) closeDialog(el);
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => onClose && onClose();
    const handleClick = (e) => {
      if (e.target === el) closeDialog(el);
    };
    el.addEventListener("close", handleClose);
    el.addEventListener("click", handleClick);
    return () => {
      el.removeEventListener("close", handleClose);
      el.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  return (
    <dialog ref={ref} className="sheet" aria-label={title}>
      <div className="sheet-inner">
        <div className="sheet-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="sub">{subtitle}</p>}
          </div>
          <div className="sheet-head-actions">
            {headAction}
            <button className="btn icon quiet" onClick={() => ref.current && closeDialog(ref.current)} aria-label="Close">
              ×
            </button>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </dialog>
  );
}
