import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Sheet.css';

/**
 * Accessible modal: a bottom sheet on phones, a centred dialog on larger screens.
 * Rendered in a portal so no ancestor (e.g. the blurred sticky header) can clip it.
 */
export default function Sheet({ open, onClose, title, icon, children, closeLabel, tone = 'default' }) {
  const titleId = useId();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.activeElement;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (previous && typeof previous.focus === 'function') previous.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="sheet" role="presentation">
      <div className="sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div className={`sheet__panel sheet__panel--${tone}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <span className="sheet__grabber" aria-hidden="true" />
        <div className="sheet__head">
          {icon ? <span className="sheet__icon">{icon}</span> : null}
          <h2 id={titleId} className="sheet__title">
            {title}
          </h2>
          <button ref={closeRef} type="button" className="btn btn--icon btn--ghost sheet__close" onClick={onClose} aria-label={closeLabel}>
            <X size={18} />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
