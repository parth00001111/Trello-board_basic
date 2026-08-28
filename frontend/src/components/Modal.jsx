import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const Modal = ({
  open,
  onClose,
  title,
  eyebrow,
  children,
  size = "md",
  dismissible = true,
  initialFocusSelector = "",
}) => {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    let focusFrame;
    let previousBodyOverflow;
    let previousBodyPaddingRight;
    if (open) {
      previousBodyOverflow = document.body.style.overflow;
      previousBodyPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      if (!dialog.open) dialog.showModal();
      focusFrame = window.requestAnimationFrame(() => {
        const requestedTarget = initialFocusSelector
          ? dialog.querySelector(initialFocusSelector)
          : null;
        const target = requestedTarget || closeButtonRef.current;
        if (target instanceof HTMLElement && !target.hasAttribute("disabled")) {
          target.focus({ preventScroll: true });
        }
      });
    } else if (dialog.open) {
      dialog.close();
    }

    return () => {
      if (focusFrame) window.cancelAnimationFrame(focusFrame);
      if (previousBodyOverflow !== undefined) {
        document.body.style.overflow = previousBodyOverflow;
        document.body.style.paddingRight = previousBodyPaddingRight;
      }
    };
  }, [initialFocusSelector, open]);

  const close = () => {
    if (dismissible) onClose?.();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`modal modal-${size}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={close}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="modal-panel">
        <div className="modal-heading">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={close}
            disabled={!dismissible}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
};

export default Modal;
