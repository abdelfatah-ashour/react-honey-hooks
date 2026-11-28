import { useState } from "react";
import { useScrollLock } from "react-honey-hooks";

/** A cart drawer that stops the page behind it scrolling while it is open. */
export default function UseScrollLockDemo() {
  const [open, setOpen] = useState(false);
  useScrollLock(open);
  const close = () => {
    setOpen(false);
  };

  return (
    <div>
      <button
        type="button"
        className="button button--secondary"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open cart
      </button>
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: "var(--ifm-z-index-overlay)",
            background: "rgb(0 0 0 / 40%)",
          }}
          onClick={close}
        >
          <aside
            role="dialog"
            aria-label="Cart"
            className="padding--lg"
            style={{
              position: "absolute",
              insetBlock: 0,
              right: 0,
              width: "min(20rem, 85vw)",
              background: "var(--ifm-background-surface-color)",
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <p>2 jars of honey: $18</p>
            <p>Try scrolling the page behind: it stays put.</p>
            <button type="button" className="button button--primary" onClick={close}>
              Close
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
