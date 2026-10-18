import { useEffect, useRef } from "react";

/**
 * Bottom sheet on phones, centred dialog on larger screens.
 * Built on the native <dialog> so Escape, focus trapping and the backdrop come free.
 */
export default function Sheet({ open, onClose, title, subtitle, children, footer }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      const body = el.querySelector(".sheet-body");
      if (body) body.scrollTop = 0;
    }
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => onClose && onClose();
    const handleClick = (e) => {
      if (e.target === el) el.close();
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
          <button className="btn icon quiet" onClick={() => ref.current?.close()} aria-label="Close">
            ×
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </dialog>
  );
}
