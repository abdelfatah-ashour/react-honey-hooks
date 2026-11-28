import { useRef } from "react";
import { useMouse } from "react-honey-hooks";

/** A card with a spotlight that follows the mouse while it is over the card. */
export default function UseMouseDemo() {
  const cardRef = useRef<HTMLDivElement>(null);
  const spot = useMouse(cardRef)?.element;
  const inside =
    spot !== undefined &&
    spot !== null &&
    spot.x >= 0 &&
    spot.y >= 0 &&
    spot.x <= spot.width &&
    spot.y <= spot.height;

  return (
    <div>
      <div
        ref={cardRef}
        role="group"
        aria-label="Spotlight card"
        className="padding--lg"
        style={{
          border: "1px solid var(--ifm-color-emphasis-300)",
          borderRadius: "var(--ifm-global-radius)",
          backgroundImage: inside
            ? `radial-gradient(circle at ${String(spot.x)}px ${String(spot.y)}px, var(--ifm-color-primary-lightest), transparent 120px)`
            : undefined,
        }}
      >
        <p role="status">{inside ? "Spotlight on" : "Spotlight off"}</p>
      </div>
      <p className="margin-top--sm">Move your mouse over the card.</p>
    </div>
  );
}
