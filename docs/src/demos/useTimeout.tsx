import { useState } from "react";
import { useTimeout } from "react-honey-hooks";

/** A toast that hides itself a second after it appears. */
function Toast({ onHide }: { onHide: () => void }) {
  useTimeout(onHide, 1000);

  return (
    <p role="status" className="alert alert--success margin-top--sm">
      Changes saved
    </p>
  );
}

export default function UseTimeoutDemo() {
  // Each save gets a new key, so a fresh toast starts its own timer.
  const [toastKey, setToastKey] = useState<number | null>(null);

  return (
    <div>
      <button
        type="button"
        className="button button--secondary"
        onClick={() => {
          setToastKey((key) => (key ?? 0) + 1);
        }}
      >
        Save
      </button>
      {toastKey !== null && (
        <Toast
          key={toastKey}
          onHide={() => {
            setToastKey(null);
          }}
        />
      )}
    </div>
  );
}
