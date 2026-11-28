import { useRef } from "react";
import { useHover } from "react-honey-hooks";

/** A badge that shows delivery details in a tooltip while the pointer is over it. */
export default function UseHoverDemo() {
  const badgeRef = useRef<HTMLSpanElement>(null);
  const hovered = useHover(badgeRef);

  return (
    <div>
      <span
        ref={badgeRef}
        className="badge badge--success"
        aria-describedby={hovered ? "shipping-tooltip" : undefined}
      >
        Free shipping
      </span>
      {hovered && (
        <span
          id="shipping-tooltip"
          role="tooltip"
          className="badge badge--secondary margin-left--sm"
        >
          Arrives in 3–5 business days.
        </span>
      )}
      <p className="margin-top--md">Orders over $50 ship free.</p>
    </div>
  );
}
